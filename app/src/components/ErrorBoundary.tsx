import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary fångade fel:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Ett oväntat fel uppstod';
      const stack = this.state.error?.stack || '';
      const componentStack = this.state.errorInfo?.componentStack || '';

      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" />
          <View style={styles.header}>
            <Text style={styles.headerIcon}>⚠️</Text>
            <Text style={styles.headerTitle}>Något gick fel</Text>
            <Text style={styles.headerSubtitle}>
              Appen stötte på ett fel men förhindrade att den stängdes ner.
            </Text>
          </View>

          <ScrollView style={styles.logContainer} contentContainerStyle={styles.logContent}>
            <Text style={styles.sectionTitle}>Felmeddelande:</Text>
            <Text style={styles.errorMessage} selectable>
              {errorMessage}
            </Text>

            {stack ? (
              <>
                <Text style={styles.sectionTitle}>Stack Trace:</Text>
                <Text style={styles.stackTrace} selectable>
                  {stack}
                </Text>
              </>
            ) : null}

            {componentStack ? (
              <>
                <Text style={styles.sectionTitle}>Komponent-hierarki:</Text>
                <Text style={styles.stackTrace} selectable>
                  {componentStack}
                </Text>
              </>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.restartBtn} onPress={this.handleRestart} activeOpacity={0.85}>
              <Text style={styles.restartBtnText}>🔄 Försök igen</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 42,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    textAlign: 'center',
  },
  logContainer: {
    flex: 1,
    margin: 16,
    backgroundColor: '#18181B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  logContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E4E4E7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 6,
  },
  errorMessage: {
    color: '#F87171',
    fontSize: 14,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  stackTrace: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#27272A',
  },
  restartBtn: {
    backgroundColor: '#0F4C5C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  restartBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
