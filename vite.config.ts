import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { studyLog } from './vite/study-log'

export default defineConfig({
  // STUDY_DATA_DIR points the study log somewhere else, such as a test folder.
  plugins: [react(), studyLog(process.env.STUDY_DATA_DIR || 'data')],
  server: { port: 3025, strictPort: true },
})
