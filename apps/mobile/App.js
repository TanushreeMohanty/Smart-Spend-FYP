import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello Tanu! ✨</Text>
      <Text style={styles.sub}>Mobile Setup Complete.</Text>
    </View>
  );
}

const styles1 = StyleSheet.create({});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 30, fontWeight: 'bold', color: '#4F46E5' },
  sub: { fontSize: 16, color: '#666', marginTop: 10 }
});