import { WelcomeScreen } from '@/components/WelcomeScreen'
import { UpdateNotification } from '@/components/UpdateNotification'

export function App(): React.JSX.Element {
  return (
    <>
      <WelcomeScreen />
      <UpdateNotification />
    </>
  )
}
