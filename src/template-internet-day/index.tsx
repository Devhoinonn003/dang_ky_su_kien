'use client'

import App from './src/App'
import type { RegistrationPageProps } from './src/types'

/** Entry point of the template: the host renders this default export with the 5 props. */
export default function RegistrationPage(props: RegistrationPageProps) {
  return <App {...props} />
}
