import ministersDB from "@root/ministers.json" with { type: "json"};
import Link from "next/link";

export default function Page() {
  return (
    <main className="pt-20">
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

      <section className="flex flex-col gap-y-6 mt-10 max-w-prose">
        {/* Intro bit */}
        <div className="flex flex-col gap-y-2">
          <h4>Oss</h4>

          <p>
            Vi är en liten grupp vänner som kallar oss själva för <span className="italic">Regeringen</span> på ett skämtsamt sätt. Vi har utsett varandra till <Link className="global" href="/ministrar">ministrar</Link> inom diverse områden. Vi är uppe i {Object.keys(ministersDB).length} stycken! Dessutom har vi en kung, gud, talman och en diktator (som statschef bara).
          </p>

          <div>
            <p>Vårt statsskicka kan <span className="italic">&quot;sammanfattas&quot;</span> som...<br /></p>

            <div className="bg-gray-700 rounded-md text-background font-normal italic py-1 pb-2 px-3 w-10/12">
              Kommunistisk teokratisk absolut monarki med en diktatorisk statschef och ett rådgivande direktdemokratiskt organ.
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <h4>Namnet</h4>
          <div className="flex flex-col gap-y-3">
            <p className="[&>span]:font-normal">
              Regeringen är vår Discord-server där vi, ministrarna, håller kontakt. Servern är uppdelad i olika kategorier, främst <span>RIKSDAGEN</span> och <span>DEPARTEMENT</span>.
            </p>

            <p className="[&>span]:font-normal">
              Vi röstar och diskuterar olika beslut och lagförslag i kanalen #motioner som ligger under <span>RIKSDAGEN</span>. Kanalen <span>#domstolen</span> hittas även där. Där lägger, spårar och dokumentarer vi rättsfall som kommer ske, pågår eller har skett. Alla ministrar har rätt att stämma varandra inför domstolen av i princip vilken anledning som helst.
            </p>

            <p className="[&>span]:font-normal">
              Under <span>DEPARTEMENT</span> ligger kanalerna för många av dem olika departementen som leds av respektive minister. Exempelvis har vi <span>#transport-departementet</span> där allt transportrelaterat diskuteras.
            </p>
          </div>
        </div>

        <div>
          <h4 className="mb-1">Jämfört med Sverige</h4>
          <p className="[&>span]:font-normal">
            För den som minns hur det svenska stadsskicket innebär det några saker: Ett, vi som ministrar röstar i riksdagen på motioner, vilket är helt fel gentemot hur sverige gör. Två, vår domstol är ett utskott av riksdagen och är därmed ett politiskt organ vilket inte är fallet i Sverige. Tre, vi saknar statsminister
          </p>
        </div>
      </section>
    </main>
  )
}