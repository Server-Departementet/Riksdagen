import { StatsskickPage } from "./statsskick/page";

export default async function Page() {
  return (
    <main>
      <h1 className="mt-14">Välkommen till Riksdagen</h1>
      <p className="mt-2 text-xl text-center">Det här är den så kallade <span className="italic">Regeringens</span> samlingswebbsida för allt möjligt</p>

      <section className="mt-16">
        <StatsskickPage />
      </section>
    </main>
  )
}