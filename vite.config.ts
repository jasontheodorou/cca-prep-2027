import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { notes } from './vite/notes'
import { studyLog } from './vite/study-log'

export default defineConfig({
  // STUDY_DATA_DIR and NOTES_DIR point the study log and the notes somewhere
  // else, such as a test folder.
  plugins: [react(), studyLog(process.env.STUDY_DATA_DIR || 'data'), notes(process.env.NOTES_DIR || 'notes')],
  server: { port: 3025, strictPort: true },
})
