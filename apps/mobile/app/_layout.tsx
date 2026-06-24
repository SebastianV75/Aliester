import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const WEB_APP_URL = 'https://aliester.vercel.app';

export default function RootLayout() {
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#a0a0a0" />
          </View>
        )}
        <WebView
          source={{ uri: WEB_APP_URL }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          originWhitelist={['*']}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    zIndex: 10,
  },
});
