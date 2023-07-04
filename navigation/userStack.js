import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'

import HomeScreen from '../screens/Home'

const Stack = createStackNavigator()

export default function UserStack() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name='Food Trucks Mobile' component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
