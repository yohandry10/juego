import type { GeopoliticsState, InternationalOrganization } from "../domain/geopolitics-types.js";
import { collectiveEligibility, organizationMember, organizationParticipationRestriction } from "../engine/world-institutions.js";

export function OrganizationCard({ state, organization }: { state: GeopoliticsState; organization: InternationalOrganization }) {
  const member = organizationMember(state, organization.id, state.playerCountryId);
  const standing = member ? collectiveEligibility(state, organization, state.playerCountryId) : null;
  const restriction = organizationParticipationRestriction(organization, state.playerCountryId);
  const text = !member ? "Tu país no es miembro de este organismo en el escenario."
    : restriction ? "Tu país es miembro, pero la fuente del escenario conserva una suspensión de participación. Mejorar la estabilidad no la elimina."
    : standing?.eligible ? "Tu país cumple las condiciones del juego para recibir beneficios de los acuerdos colectivos."
    : "Tu país es miembro, pero sus beneficios están en pausa. Recuperar la estabilidad y la confianza de los socios puede habilitarlos.";
  return <article><strong>{organization.name}</strong><p>{text}</p>
    <details><summary>Ver membresía y condiciones</summary>
      <p>{organization.memberCodes.length} miembros representados{organization.rosterSource ? ` de ${organization.rosterSource.officialMemberCount} miembros oficiales.` : ` · ${organization.description}`}</p>
      {!restriction && <p>{standing?.explanation ?? "Sin participación en este escenario."}</p>}
      {organization.rosterSource && <p>Lista revisada el {organization.rosterSource.accessedOn}: <a href={organization.rosterSource.url} target="_blank" rel="noreferrer">fuente oficial</a>. {organization.rosterSource.scopeNote}</p>}
      {restriction && <p>{restriction.reason} <a href={restriction.sourceUrl} target="_blank" rel="noreferrer">Ver fundamento de la suspensión</a>.</p>}
    </details>
  </article>;
}
