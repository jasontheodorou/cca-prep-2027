import { createElement } from 'react'
import { Head } from '../components/Head'
import './shortbread-pet.js'

/* Pet: Shortbread, the small 3D bear from sanctum, copied as it is
 * (src/features/shortbread-pet.js). The element keeps its own once-a-day
 * limit in this browser's storage, separate from sanctum's. */

export function Pet() {
  return (
    <main id="main" className="wrap">
      <Head title="Pet" line="This is Shortbread, a small bear who keeps you company." />
      <section className="card card--tone petcard" data-tone="sand" aria-label="Shortbread">
        <div className="petcard__bear">{createElement('shortbread-pet', { 'storage-key': 'cca-prep.pet' })}</div>
        <p className="muted petcard__line explainer">Once a day you can give a treat, share some study time or pet them on the head.</p>
      </section>
    </main>
  )
}
