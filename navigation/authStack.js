import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'

import SignInScreen from '../screens/SignInScreen.tsx'
import SignOutScreen from '../screens/SignUpScreen.tsx'
import WelcomeScreen from '../screens/Welcome.tsx'

const Stack = createStackNavigator()

export default function AuthStack() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name='Food Trucks Mobile' component={WelcomeScreen} />
        <Stack.Screen name='Sign In' component={SignInScreen} />
        <Stack.Screen name='Sign Up' component={SignOutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
