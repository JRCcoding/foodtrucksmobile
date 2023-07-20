import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'

import HomeScreen from '../screens/Home'
import OwnerHomeScreen from '../screens/OwnerHome'

const Stack = createStackNavigator()

export default function UserStack() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen name='Food Trucks Mobile' component={HomeScreen} />
        <Stack.Screen
          name='Dashboard'
          options={{ headerBackTitleVisible: false }}
          component={OwnerHomeScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
