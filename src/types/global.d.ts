declare module 'react-datepicker' {
  import { ReactDatePickerProps } from 'react-datepicker'
  const DatePicker: React.FC<ReactDatePickerProps>
  export default DatePicker
}

// Ajout d'autres types globaux si nécessaire
declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.jpeg' {
  const content: string
  export default content
}

// Types pour les variables d'environnement
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_APP_VERSION: string
    // Ajoutez d'autres variables d'environnement ici
  }
}

