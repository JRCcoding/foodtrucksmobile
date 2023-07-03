import * as Location from 'expo-location'
import { getAuth } from 'firebase/auth'
import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Button } from 'react-native-elements'
import MapView from 'react-native-maps'
import { useAuthentication } from '../utils/hooks/useAuthentication'

export default function Home() {
  const [location, setLocation] = useState(null)
  const [lat, setLat] = useState(null)
  const [long, setLong] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  useEffect(() => {
    ;(async () => {
      let { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied')
        return
      }

      let location = await Location.getCurrentPositionAsync({})
      setLocation(location)
      if (errorMsg) {
        lat = errorMsg
      } else if (location) {
        setLat(JSON.stringify(location.coords.latitude))
        setLong(JSON.stringify(location.coords.longitude))
      }
    })()
  }, [])

  const { user } = useAuthentication()
  const auth = getAuth()

  const signOut = async () => {
    try {
      await auth.signOut() // Call the signOut method from the Firebase authentication module
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <View style={styles.container}>
      <Text>Welcome {user?.email}!</Text>

      <Button
        title='Sign Out'
        style={styles.button}
        onPress={() => signOut(auth)}
      />
      {location ? (
        // <Map />
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 31.9499832,
            longitude: -102.1687033,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        />
      ) : (
        <Text>Allow location permissions</Text>
      )}

      <Text>
        {lat}, {long}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: 10,
  },
  map: {
    width: '80%',
    height: '50%',
  },
})
