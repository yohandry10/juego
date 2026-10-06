import type { CareerGameState } from "../domain/career-types.js";
import type { CountryDefinition } from "../domain/types.js";
import { canEnactForeignPolicy, fulfillFinancingCommitment, requestInternationalFinancing } from "../application/diplomacy-commands.js";
import { ratifyInternationalTreaty } from "../application/career-commands.js";
import { organizationMember } from "../engine/world-institutions.js";
import terms from "../data/financing-parameters.json" with { type: "json" };

const offers = [
  { lender: "imf" as const, name: "FMI", title: "Apoyo para estabilizar la economía", benefit: "Más reservas para afrontar una crisis.", commitment: "Mejorar las cuentas del Estado: reducir la diferencia entre lo que gasta y lo que ingresa.", risk: "El ajuste puede frenar la economía y bajar tu popularidad.", action: "Ajustar el gasto", actionEffect: "Reduce el gasto y el déficit. También baja un poco el crecimiento y la aprobación." },
  { lender: "world-bank" as const, name: "Banco Mundial", title: "Financiar inversión y obras", benefit: "Recursos para invertir; pueden ayudar a crear empleo.", commitment: "Aumentar la inversión del país y mantenerla hasta la siguiente revisión.", risk: "Las inversiones aumentan la deuda y presionan el presupuesto.", action: "Destinar recursos a inversión", actionEffect: "Aumenta la inversión. También aumenta el déficit porque el Estado gasta más." },
];

export function FinancingView({ state, country, update }: { state: CareerGameState; country: CountryDefinition; update: (state: CareerGameState) => void }) {
  const geo = state.geopolitics;
  const official = canEnactForeignPolicy(state);
  const executive = state.stage === "executive" && official;
  const canRatify = executive ? state.player.resources.politicalCapital >= 3 : state.stage === "legislature" && Boolean(state.legislature?.actionsRemaining);
  return <section className="financing-section" aria-labelledby="financing-heading">
    <h3 id="financing-heading">Pedir apoyo económico</h3>
    <p className="financing-intro">Recibes un préstamo en {terms.trancheCount} entregas. Para seguir recibiendo dinero debes cumplir un compromiso. Lo recibido aumenta la deuda y se devuelve después.</p>
    <div className="financing-grid">{offers.map((offer) => {
      const member = organizationMember(geo, offer.lender, geo.playerCountryId);
      const treaty = [...geo.treaties].reverse().find((t) => t.partnerId === offer.lender);
      const outstandingAgreement = treaty && ["proposed", "ratified"].includes(treaty.status);
      const program = treaty?.financing;
      const waiting = treaty?.status === "proposed";
      const hasProgram = Boolean(program);
      const indicator = offer.lender === "imf" ? state.world.economy.indicators.fiscalDeficitPercentGdp : state.world.economy.indicators.domesticInvestmentPercentGdp;
      const met = program && (offer.lender === "imf" ? indicator <= program.target : indicator >= program.target);
      const canAct = program && ["approved", "active", "suspended"].includes(program.status);
      const doneThisQuarter = program?.lastCommitmentQuarter === geo.quarterIndex;
      const reviewIn = program ? Math.max(1, program.nextReviewQuarter - geo.quarterIndex) : 0;
      const status = program ? ({ approved: "Aprobado: primera entrega pendiente", active: "Préstamo en marcha", suspended: "Próxima entrega en pausa", completed: "Ya recibiste las cuatro entregas", terminated: "Terminó el plazo para recibir dinero", repaid: "Préstamo devuelto" })[program.status] : waiting ? "Solicitud pendiente de votación" : treaty?.status === "rejected" ? "El Congreso rechazó la solicitud" : "Opción disponible";
      return <article className="financing-card" key={offer.lender} aria-label={`Apoyo del ${offer.name}`}>
        <span className="eyebrow">{offer.name}</span><h4>{offer.title}</h4>
        <dl className="financing-terms"><div><dt>Qué recibes</dt><dd>{offer.benefit}</dd></div><div><dt>Tu compromiso</dt><dd>{offer.commitment}</dd></div><div><dt>Qué arriesgas</dt><dd>{offer.risk} Devolverás el préstamo con un costo financiero.</dd></div></dl>
        <p className={`financing-status ${program?.status === "suspended" ? "is-paused" : ""}`}><strong>{status}</strong></p>
        {waiting && <div className="financing-next"><p>Aún no has recibido dinero. El Congreso debe aprobar la solicitud; puede rechazarla.</p><button className="secondary-button" disabled={!canRatify} onClick={() => update(ratifyInternationalTreaty(state, country, treaty!.id))}>Someter a votación</button><p>{canRatify ? executive ? "Convocar cuesta 3 de capital político." : "La votación usa una de tus acciones de este turno." : "Podrás convocar la votación cuando tengas una sesión legislativa o encabeces un Gobierno con capital disponible."}</p></div>}
        {treaty?.status === "rejected" && <p>El préstamo no se aprobó. Antes de volver a solicitarlo, negocia más apoyo en el Congreso. La influencia gastada en la solicitud no se recupera.</p>}
        {hasProgram && <div className="financing-next">
          <label className="financing-progress">Entregas recibidas: {program!.tranches} de {terms.trancheCount}<progress aria-label={`Entregas recibidas del ${offer.name}`} value={program!.tranches} max={terms.trancheCount}/></label>
          {canAct && <>{program!.status === "approved" && <p>La primera entrega llegará al avanzar el próximo trimestre. Prepara el compromiso para recibir las siguientes.</p>}<p><strong>{met ? "Tu compromiso está cumplido por ahora." : "Falta cumplir tu compromiso."}</strong> {met ? "Mantén las cuentas así hasta la revisión." : offer.actionEffect} Próxima revisión: {reviewIn === 1 ? "al avanzar el próximo trimestre" : `dentro de ${reviewIn} trimestres`}.</p>
            {program!.status === "suspended" && <p>No recibiste la última entrega. Si cumples antes de que venza el acuerdo, el préstamo puede continuar.</p>}
            {!met && <button disabled={!official || state.player.resources.politicalCapital < terms.commitmentCapitalCost || doneThisQuarter} onClick={() => update(fulfillFinancingCommitment(state, treaty!.id))}>{offer.action} · {terms.commitmentCapitalCost} de capital</button>}
            {doneThisQuarter && <p>Ya aplicaste este compromiso en el trimestre. Avanza para ver el resultado.</p>}
            {!official && !met && <p>La decisión corresponde al Gobierno. Desde el Congreso puedes votar el acuerdo, pero no aplicar su presupuesto.</p>}
            {official && !met && state.player.resources.politicalCapital < terms.commitmentCapitalCost && <p>Necesitas {terms.commitmentCapitalCost} de capital político para aplicar el compromiso.</p>}
          </>}
          {["completed", "terminated"].includes(program!.status) && <p>No habrá más entregas. El dinero que recibiste sigue siendo una deuda que tendrás que devolver.</p>}
          {program!.status !== "repaid" && <p>La devolución empieza en el cuarto año del acuerdo y se reparte en cuatro pagos anuales. Cada pago reduce la deuda y deja menos recursos disponibles.</p>}
        </div>}
        {!outstandingAgreement && <><button className="primary-button" disabled={!member || geo.player.influence < terms.requestInfluenceCost} onClick={() => update(requestInternationalFinancing(state, offer.lender))}>Solicitar apoyo del {offer.name}</button><p className="financing-cost">Cuesta {terms.requestInfluenceCost} de influencia, tu capacidad para negociar fuera del país. Después necesitarás la aprobación del Congreso.</p>{!member ? <p>Tu país no participa en este organismo en el escenario actual.</p> : geo.player.influence < terms.requestInfluenceCost ? <p>Te falta influencia para presentar la solicitud.</p> : null}</>}
        {treaty?.status === "ratified" && !program && <p>Este acuerdo viene de un guardado anterior. Sus efectos se conservan; no se entrega el mismo préstamo de nuevo.</p>}
        <details><summary>Ver cifras y reglas del acuerdo</summary><p>PIB es el valor de lo que produce el país en un año. Las cifras siguientes indican el tamaño del préstamo respecto a esa economía; no son dinero de campaña.</p>{program ? <><p>Total aprobado: {program.committedPercentGdp.toFixed(2)}% del PIB; recibido: {program.disbursedPercentGdp.toFixed(2)}%; devuelto: {program.repaidPercentGdp.toFixed(2)}%.</p><p>{offer.lender === "imf" ? "Déficit actual" : "Inversión actual"}: {indicator.toFixed(2)}% del PIB. Meta: {offer.lender === "imf" ? "como máximo" : "como mínimo"} {program.target.toFixed(2)}%. Plazo para recibir las entregas: trimestre {program.deadlineQuarter} del mundo.</p>{program.reviews.slice(-3).map((r) => <p key={r.quarter}>{r.explanation}</p>)}</> : <p>Cuatro entregas suman {offer.lender === "imf" ? "8" : "3"}% del PIB. La primera llega después de aprobar el acuerdo. Luego se revisa cada dos trimestres {offer.lender === "imf" ? "que el déficit haya bajado al menos 0,5 puntos" : "que la inversión haya subido al menos 0,5 puntos"} respecto al inicio.</p>}<p>Son reglas simplificadas del juego. No reproducen un contrato ni condiciones oficiales de estos organismos.</p></details>
      </article>;
    })}</div>
  </section>;
}
