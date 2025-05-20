import React, { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import { useAuth } from '../context/AuthContext'
import '../styles/global.css'

export default function Index() {
    

  const { session } = useAuth()

  if (!session) {
 
    return <Redirect href="/(auth)/login" />
  }else if (session) {

    return <Redirect href="/(app)/home" />
  }

} 