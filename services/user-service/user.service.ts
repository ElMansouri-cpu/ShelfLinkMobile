import { User } from "./user.type"
import { supabase } from '../../lib/supabase'
import { Alert } from "react-native"



export async function getProfile() {
  const { data: { session } } = await supabase.auth.getSession()


  try {
    if (!session?.user) throw new Error('No user on the session!')

    const { data, error, status } = await supabase
      .from('users')
      .select('username, email')
      .eq('id', session.user.id)
      .single()

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('phone_number')
      .eq('id', session.user.id)
      .single()

    if (error && status !== 406) throw error

    if (data) {
      return { ...data, phone: !profileError ? profileData?.phone_number : "" }

    }
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message)
    }
  } finally {
  }
}

export async function updateProfileEmail(email: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const { error } = await supabase.auth.updateUser({
    email: email
  })
  if (!session?.user) throw new Error('No user on the session!')


  if (error) {
    if (error.code === "email_exists")
      Alert.alert("Email already used")
    else if (error.code === "invalid_email")
      Alert.alert("Invalid email")
    else if (error.code === "email_not_found")
      Alert.alert("Email not found")

    else
      Alert.alert(error.message)
  } else {
    Alert.alert("Email updated successfully")

  }

  console.log(error, "error")


  // Check if email already exists and is not the current user's
}

export async function updateProfile(Updates: Partial<User>) {
  const { error } = await supabase.from('users').update(Updates).eq('id', Updates?.id)
  if (error) throw error

}

export async function updatePassword(password: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('No user on the session!')
  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) throw error

}

export async function updatePhone(phone: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('No user on the session!')

  const { error, status } = await supabase.from('profiles').upsert({ id: session.user.id, phone_number: phone }).eq('id', session.user.id)

  if (error && status !== 406) Alert.alert(error.message)
  else Alert.alert("Phone number updated successfully")


}

export async function insertPhone(phone: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('No user on the session!')
  const { error } = await supabase.from('profiles').insert({ id: session.user.id, phone_number: phone }).eq('id', session.user.id)

  if (error) Alert.alert(error.message)
  else Alert.alert("Phone number inserted successfully")

}



