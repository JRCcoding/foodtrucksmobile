import { StackScreenProps } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-elements';

const WelcomeScreen: React.FC<StackScreenProps<any>> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text>Sign in to view nearby live food trucks!</Text><Text> Don't have an account? Sign up as a customer OR request a business account if you own a food truck!</Text>

      <View style={styles.buttons}>
          <Button title="Sign in" buttonStyle={styles.button} onPress={() => navigation.navigate('Sign In')} />

          <View style={{flexDirection: 'row', gap: 25}}>
        
        <Button title="Sign up" type="outline" buttonStyle={styles.button} onPress={() => navigation.navigate('Sign Up')} />
        <Button title="Business Sign up" type='outline' buttonStyle={styles.button} onPress={() => navigation.navigate('Business Sign Up')} />
          </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttons: {
    flex: 1,
  },

  button: {
    marginTop: 10
  }
});

export default WelcomeScreen;
