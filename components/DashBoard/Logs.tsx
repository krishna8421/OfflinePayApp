import {View, StyleSheet, Text} from 'react-native';
import {Divider} from 'react-native-elements';
import React from 'react';

type Props = {
  logs: string[];
};

export default function Logs({logs}: Props) {
  return (
    <View style={styles.logView}>
      {logs
        .slice(0)
        .reverse()
        .map((item, index) => {
          return (
            <View key={index} style={styles.logTextView}>
              <Text style={styles.text}>{item}</Text>
              <Divider style={styles.divider} />
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  logView: {
    alignItems: 'center',
    width: '100%',
    height: '93%',
    overflow: 'hidden',
  },
  logTextView: {
    marginVertical: 8,
  },
  divider: {
    backgroundColor: 'gray',
    marginTop: 8,
  },
  text: {
    fontSize: 9,
  },
});
