import 'react-native'

declare module 'react-native' {
  interface ViewProps {
    className?: string
  }
  interface TextProps {
    className?: string
  }
  interface TextInputProps {
    className?: string
  }
  interface TouchableOpacityProps {
    className?: string
  }
} 