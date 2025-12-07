import ministersDB from "@root/ministers.json" with { type: "json"};
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statsskick",
  description: "Information om vårt statsskick och hur vi organiserar oss.",
};

export default async function Page() {
  return (
    <main className="pt-20">
      {StatsskickPage()}
    </main>
  );
}

export async function StatsskickPage() {
  return (
    <>
      <h1>
        Statsskick
      </h1>

      <p className="mt-5 text-xl italic text-center bg-yellow-400 font-medium">
        {navigator.language.toLowerCase().startsWith("sv") ?
          "OBS! Vi är inte den svenska Regeringen eller Riksdagen."
          :
          "NOTE! We are not the Swedish Government or Parliament."
        }
      </p>

      <section className="flex flex-col gap-y-7 mt-10 max-w-prose pb-20">
        <div>
          <h4>Oss</h4>

          <div className="flex flex-col gap-y-4">
            <p>
              Vi är en liten grupp vänner som kallar oss själva för <span className="italic">Regeringen</span> på ett skämtsamt sätt. Vi har utsett varandra till <Link className="global" href="/ministrar">ministrar</Link> inom diverse områden. Vi är uppe i {Object.keys(ministersDB).length} stycken! Dessutom har vi en kung, gud, talman och en diktator (som statschef bara).
            </p>

            <div>
              <p>Vårt statsskick kan <span className="italic">&quot;sammanfattas&quot;</span> som...<br /></p>

              <div className="bg-gray-700 rounded-md text-background font-normal italic py-1 pb-2 px-3 w-10/12">
                Kommunistisk teokratisk absolut monarki med en diktatorisk statschef och ett rådgivande direktdemokratiskt organ.
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4>Namnet</h4>

          <div className="flex flex-col gap-y-4">
            <p className="[&>span]:font-normal">
              Regeringen är vår Discord-server där vi, ministrarna, håller kontakt. Servern är uppdelad i olika kategorier, främst <span>Riksdagen</span> och <span>Departement</span>.
            </p>

            <p className="[&>span]:font-normal">
              Vi röstar och diskuterar olika beslut och lagförslag i kanalen <span>#motioner</span> som ligger under <span>Riksdagen</span>. Kanalen <span>#domstolen</span> hittas även där. Där skapar, spårar och dokumenterar vi rättsfall som kommer ske, pågår eller har skett. Alla ministrar har rätt att stämma varandra inför domstolen av i princip vilken anledning som helst.
            </p>

            <p className="[&>span]:font-normal">
              Under <span>Departement</span> ligger kanalerna för många av de olika departementen som leds av respektive minister. Exempelvis har vi <span>#transport-departementet</span> där allt transportrelaterat diskuteras.
            </p>

            <p className="[&>span]:font-normal">
              Namnet Riksdagen använder vi annars för den här webbplatsen! Här hittar du informationen du läser samt mycket mer. Kika gärna runt!
            </p>
          </div>
        </div>

        <div>
          <h4>Jämfört med Sverige</h4>

          <div className="flex flex-col gap-y-4">
            <p className="[&>span]:font-normal">
              Vet man hur det svenska statsskicket ser ut så får man säkert utslag av att höra allt detta:
            </p>

            <p className="[&>span]:font-normal">
              Ett, vi som ministrar röstar i riksdagen på motioner, vilket är helt fel gentemot hur Sverige gör.
            </p>

            <p className="[&>span]:font-normal">
              Två, vår domstol är ett utskott av riksdagen och är därmed ett politiskt organ vilket inte är fallet i Sverige.
            </p>

            <p className="[&>span]:font-normal">
              Tre, vi saknar statsminister men vi har en talman som saknar makt, samt en diktator som statschef men den positionen härleder ingen makt heller. Inte ens vår kung har någon makt (nej, kungen är inte vår statschef). Vår sanna ledare är såklart gud! Han heter Axel och är en av oss ministrar.
            </p>

            <p>
              Vi har, likt Sverige, svenska som officiellt språk. Men, till skillnad från Sverige, är våra minoritetsspråk: engelska, tyska, norska och finska. Dessutom har vi ett kyrkospråk: latin.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}