import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Button, Card } from 'react-native-elements'

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Card containerStyle={styles.card}>
        <Card.Title>Sign in to view nearby live food trucks!</Card.Title>
        <Text>
          {' '}
          Don't have an account? Sign up as a customer OR request a business
          account if you own a food truck!
        </Text>
        {/* <View style={styles.buttons}> */}
        <Button
          title='Sign in'
          buttonStyle={styles.signinbutton}
          onPress={() => navigation.navigate('Sign In')}
        />

        {/* <View style={{ flexDirection: 'row', gap: 25 }}> */}
        <Button
          title='Sign up'
          type='outline'
          buttonStyle={styles.button}
          onPress={() => navigation.navigate('Sign Up')}
        />
        <Button
          title='Business Sign up'
          type='outline'
          buttonStyle={styles.button}
          onPress={() => navigation.navigate('Business Sign Up')}
        />
        {/* </View> */}
        {/* </View> */}
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 'auto',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  card: {},
  signinbutton: {
    marginTop: 30,
    marginBottom: 30,
  },
  button: {
    marginTop: 10,
  },
})

export default WelcomeScreen
