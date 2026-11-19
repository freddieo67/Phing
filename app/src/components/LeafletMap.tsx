import React, { useRef, useEffect, useMemo } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, View } from 'react-native';

export interface MapMarkerData {
  id: string;
  lat: number;
  lng: number;
  title: string;
  label?: string;
  color: string;
  emoji?: string;
  ringColor?: string;
  teamName?: string;
  photoThumb?: string | null;
  shareId?: number;
  isMeetingPoint?: boolean;
  isOffline?: boolean;
  offlineLabel?: string;
}

interface Props {
  centerLat: number;
  centerLng: number;
  markers: MapMarkerData[];
  onMarkerPress?: (marker: MapMarkerData) => void;
  onCenterChange?: (lat: number, lng: number) => void;
}

export interface LeafletMapRef {
  focusOn: (lat: number, lng: number, targetZoom?: number) => void;
}

const LeafletMap = React.forwardRef<LeafletMapRef, Props>(
  ({ centerLat, centerLng, markers, onMarkerPress, onCenterChange }, ref) => {
    const webViewRef = useRef<any>(null);
    const readyRef = useRef(false);
    const pendingFocus = useRef<{ lat: number; lng: number; targetZoom?: number } | null>(null);
    const initialCenterRef = useRef({ lat: centerLat, lng: centerLng });

    const flyTo = (lat: number, lng: number, targetZoom?: number) => {
      // Behåll alltid användarens nuvarande zoomnivå så att den aldrig återställs vid uppdateringar!
      const js = `if (typeof map !== 'undefined') {
        var z = ${targetZoom !== undefined ? targetZoom : 'map.getZoom()'};
        map.flyTo([${lat}, ${lng}], z, { animate: true, duration: 0.8 });
      }; true;`;
      webViewRef.current?.injectJavaScript(js);
    };

    React.useImperativeHandle(ref, () => ({
      focusOn: (lat: number, lng: number, targetZoom?: number) => {
        if (!readyRef.current) {
          pendingFocus.current = { lat, lng, targetZoom };
          return;
        }
        flyTo(lat, lng, targetZoom);
      },
    }));

    // htmlSource memoiseras så att WebView ALDRIG laddar om sidan och återställer kartzoomen
    const htmlSource = useMemo(
      () => ({
        html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; }
        html, body, #map { height: 100vh; width: 100vw; }
        .leaflet-tile-pane { filter: grayscale(0.18) sepia(0.11) contrast(0.98) brightness(1.01); }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: false,
          maxZoom: 22
        }).setView([${initialCenterRef.current.lat}, ${initialCenterRef.current.lng}], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 22,
          maxNativeZoom: 19
        }).addTo(map);

        map.on('moveend', function() {
          var c = map.getCenter();
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'centerChanged', lat: c.lat, lng: c.lng }));
          }
        });

        var markers = {};

        function updateMarkers(newMarkers) {
          var newIds = {};
          newMarkers.forEach(function(m) {
            newIds[m.id] = true;
            var isUser = m.id === 'me';
            var existing = markers[m.id];
            var prevThumb = existing ? (existing._photoThumb || '') : '';
            var prevEmoji = existing ? (existing._emoji || '') : '';
            var prevLabel = existing ? (existing._label || '') : '';
            var prevRing = existing ? (existing._ringColor || '') : '';
            var prevOffline = existing ? Boolean(existing._isOffline) : false;
            var prevOfflineLabel = existing ? (existing._offlineLabel || '') : '';
            var nextThumb = m.photoThumb || '';
            var nextEmoji = m.emoji || '';
            var nextLabel = m.label || '';
            var nextRing = m.ringColor || '';
            var nextOffline = Boolean(m.isOffline);
            var nextOfflineLabel = m.offlineLabel || '';

            if (existing && prevThumb === nextThumb && prevEmoji === nextEmoji && prevLabel === nextLabel && prevRing === nextRing && prevOffline === nextOffline && prevOfflineLabel === nextOfflineLabel) {
              existing.setLatLng([m.lat, m.lng]);
              if (existing.getPopup()) {
                existing.getPopup().setContent(m.title);
              }
            } else {
              if (existing) {
                map.removeLayer(existing);
                delete markers[m.id];
              }
              var marker;

              if (m.photoThumb) {
                var photoBadgeText = m.label || (!isUser && m.title ? m.title.split(':')[0].split(' ')[0] : '');
                var clipId = 'photoClip-' + String(m.id).replace(/[^a-zA-Z0-9]/g, '_');
                var pinFill = m.ringColor || '#000';
                var pinFilter = m.ringColor
                  ? 'filter:drop-shadow(0 0 10px ' + m.ringColor + 'bb) drop-shadow(0 4px 6px rgba(0,0,0,0.45));display:block;'
                  : 'filter:drop-shadow(0 4px 6px rgba(0,0,0,0.4)) drop-shadow(0 1px 2px rgba(0,0,0,0.25));display:block;';
                var thumbHtml = '<svg width="46" height="54" viewBox="0 0 46 54" style="' + pinFilter + '">' +
                  '<defs>' +
                    '<clipPath id="' + clipId + '">' +
                      '<circle cx="23" cy="20" r="15.5" />' +
                    '</clipPath>' +
                  '</defs>' +
                  '<path d="M 23 52 L 8.1 30.1 A 18 18 0 1 1 37.9 30.1 Z" fill="' + pinFill + '" />' +
                  '<circle cx="23" cy="20" r="16" fill="#fff" />' +
                  '<image href="' + m.photoThumb + '" x="7.5" y="4.5" width="31" height="31" preserveAspectRatio="xMidYMid slice" clip-path="url(#' + clipId + ')" />' +
                '</svg>';
                var photoGroundShadow = '<div style="width:18px;height:5px;background:radial-gradient(ellipse at center,rgba(0,0,0,0.5) 0%,rgba(0,0,0,0) 75%);border-radius:50%;margin-top:-3px;margin-bottom:2px;"></div>';
                var photoBadgeHtml = photoBadgeText ? '<div style="font-size:11px;font-weight:700;color:#fff;background:rgba(15,23,42,0.85);padding:2px 7px;border-radius:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:88px;text-align:center;box-shadow:0 2px 4px rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.25);">' + photoBadgeText + '</div>' : '';

                marker = L.marker([m.lat, m.lng], {
                  icon: L.divIcon({
                    className: '',
                    html: '<div style="display:flex;flex-direction:column;align-items:center;width:90px;overflow:visible;' + (nextOffline ? 'opacity:0.65;filter:grayscale(30%);' : '') + '">' + thumbHtml + photoGroundShadow + photoBadgeHtml + '</div>',
                    iconSize: [90, 80],
                    iconAnchor: [45, 52],
                    popupAnchor: [0, -52],
                  }),
                });
                marker.on('click', function() {
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', id: m.id, shareId: m.shareId }));
                  }
                });
              } else if (m.emoji) {
                var isMeeting = Boolean(m.isMeetingPoint || m.emoji === '📍');
                var badgeText = m.label || (isMeeting ? 'Mötesplats' : (!isUser && m.title ? m.title.split(':')[0].split(' ')[0] : ''));
                var emojiNameHtml = badgeText ? '<div style="margin-top:1px;font-size:11px;font-weight:700;color:#fff;background:' + (isMeeting ? 'rgba(15,76,92,0.92)' : 'rgba(15,23,42,0.85)') + ';padding:2px 7px;border-radius:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:96px;text-align:center;box-shadow:0 2px 4px rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.25);">' + badgeText + '</div>' : '';
                var offlineBadgeHtml = (nextOffline && nextOfflineLabel) ? '<div style="margin-top:2px;font-size:9.5px;font-weight:700;color:#F3F4F6;background:rgba(75,85,99,0.95);padding:1px 6px;border-radius:8px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.3);">' + nextOfflineLabel + '</div>' : '';

                var iconInnerHtml;
                if (nextOffline) {
                  iconInnerHtml = '<div style="display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:26px;border:3px dashed ' + (m.ringColor || '#9CA3AF') + ';background:rgba(243,244,246,0.92);box-shadow:none;font-size:28px;line-height:1;margin-bottom:2px;opacity:0.8;">' + m.emoji + '</div>';
                } else if (m.ringColor) {
                  iconInnerHtml = '<div style="display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:26px;border:3.5px solid ' + m.ringColor + ';background:rgba(255,255,255,0.94);box-shadow:0 0 14px ' + m.ringColor + 'bb, 0 4px 10px rgba(0,0,0,0.35);font-size:30px;line-height:1;margin-bottom:2px;">' + m.emoji + '</div>';
                } else {
                  iconInnerHtml = '<div style="font-size:46px;line-height:1.15;padding-top:4px;overflow:visible;text-align:center;filter:drop-shadow(0 6px 8px rgba(0,0,0,0.35)) drop-shadow(0 1px 2px rgba(0,0,0,0.25));">' + m.emoji + '</div>';
                }
                var groundShadowHtml = isMeeting
                  ? '<div style="width:16px;height:5px;background:radial-gradient(ellipse at center,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0) 75%);border-radius:50%;margin-top:-4px;margin-bottom:2px;"></div>'
                  : '<div style="width:26px;height:7px;background:radial-gradient(ellipse at center,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0) 75%);border-radius:50%;margin-top:-6px;margin-bottom:2px;"></div>';

                marker = L.marker([m.lat, m.lng], {
                  icon: L.divIcon({
                    className: '',
                    html: '<div style="display:flex;flex-direction:column;align-items:center;width:100px;overflow:visible;' + (nextOffline ? 'opacity:0.75;' : '') + '">' + iconInnerHtml + groundShadowHtml + emojiNameHtml + offlineBadgeHtml + '</div>',
                    iconSize: [100, 80],
                    iconAnchor: isMeeting ? [50, 52] : [50, 46],
                    popupAnchor: isMeeting ? [0, -50] : [0, -32],
                  }),
                });
                if (m.shareId && (m.emoji === '📷' || m.isMeetingPoint)) {
                  marker.on('click', function() {
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', id: m.id, shareId: m.shareId }));
                    }
                  });
                } else {
                  marker.bindPopup(m.title);
                }
              } else {
                marker = L.circleMarker([m.lat, m.lng], {
                  color: m.color,
                  fillColor: m.color,
                  fillOpacity: nextOffline ? 0.4 : 1,
                  radius: isUser ? 6 : 8,
                  weight: isUser ? 2 : 0,
                });
                marker.bindPopup(m.title);
              }
              marker._photoThumb = nextThumb;
              marker._emoji = nextEmoji;
              marker._label = nextLabel;
              marker._ringColor = nextRing;
              marker._isOffline = nextOffline;
              marker._offlineLabel = nextOfflineLabel;
              marker.addTo(map);
              markers[m.id] = marker;
            }
          });

          for (var id in markers) {
            if (!newIds[id]) {
              map.removeLayer(markers[id]);
              delete markers[id];
            }
          }
        }
      </script>
    </body>
    </html>
  `,
      }),
      []
    );

    // Skicka in nya markörer via JS när React-staten ändras utan att påverka kartans zoom eller vy
    useEffect(() => {
      const js = `updateMarkers(${JSON.stringify(markers)}); true;`;
      webViewRef.current?.injectJavaScript(js);
    }, [markers]);

    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={htmlSource}
          style={styles.map}
          scrollEnabled={false}
          onMessage={(event: any) => {
            try {
              const payload = JSON.parse(event.nativeEvent.data);
              if (payload?.type === 'markerPress' && onMarkerPress) {
                const found = markers.find(m => m.id === String(payload.id));
                if (found) onMarkerPress(found);
              } else if (payload?.type === 'centerChanged' && onCenterChange) {
                onCenterChange(Number(payload.lat), Number(payload.lng));
              }
            } catch (_) {}
          }}
          onLoadEnd={() => {
            readyRef.current = true;
            webViewRef.current?.injectJavaScript(`updateMarkers(${JSON.stringify(markers)}); true;`);
            if (pendingFocus.current) {
              const { lat, lng, targetZoom } = pendingFocus.current;
              pendingFocus.current = null;
              flyTo(lat, lng, targetZoom);
            }
          }}
        />
      </View>
    );
  }
);

export default LeafletMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  map: {
    flex: 1,
  },
});
