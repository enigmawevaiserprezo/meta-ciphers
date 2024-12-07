/* eslint-disable no-self-assign */
import { writeFileSync } from 'fs'
import type {
  AuthenticationState,
  SignalDataTypeMap
} from './'
import { initAuthCreds, proto } from './'

const KEY_MAP: { [T in keyof SignalDataTypeMap]: string } = {
  'pre-key': 'preKeys',
  session: 'sessions',
  'sender-key': 'senderKeys',
  'app-state-sync-key': 'appStateSyncKeys',
  'app-state-sync-version': 'appStateVersions',
  'sender-key-memory': 'senderKeyMemory'
}

export const authState = async (
  creds: any
): Promise<{ state: AuthenticationState, saveState: () => void }> => {
  const saveState = async (): Promise<void> => {
    writeFileSync('auth-state.json', JSON.stringify({ creds, keys }))
  }

  const keys: any = {}

  return {
    state: {
      creds,
      keys: {
        get: (type, ids) => {
          const key = KEY_MAP[type]
          return ids.reduce((dict: any, id) => {
            let value = keys[key]?.[id]
            if (value) {
              if (type === 'app-state-sync-key') {
                value = proto.Message.AppStateSyncKeyData.fromObject(value)
              }

              dict[id] = value
            }

            return dict
          }, {})
        },
        set: (data: any) => {
          for (const _key in data) {
            const key = KEY_MAP[_key as keyof SignalDataTypeMap]
            keys[key] = keys[key]
            if (!keys[key]) keys[key] = {}
            Object.assign(keys[key], data[_key])
          }

          void saveState()
        }
      }
    },
    saveState
  }
}
