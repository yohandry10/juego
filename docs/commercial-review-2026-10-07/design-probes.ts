import { fileURLToPath } from 'node:url';
import { loadCountry } from '../../src/data/load-country.js';
import { careerEventCatalog, careerEventArcsComplete } from '../../src/data/event-catalog.js';
import { advanceCareer, castVote, createCareerGame, nominate, performCampaignAction } from '../../src/application/career-commands.js';

const country = await loadCountry(fileURLToPath(new URL('../../data/countries/peru.json', import.meta.url)));
const specificArcs = new Set(['party-nomination', 'cabinet-confidence', 'party-leadership', 'confidence-crisis', 'scandal', 'broken-trust']);
// This classifier documents the current choicesForEvent routing. It must be
// rechecked against that function if the source changes; it is not a new test.
const generic = careerEventCatalog.filter(event => !specificArcs.has(event.arcId ?? '') && !(event.arcId === 'annual-budget' && event.arcStep === 1));
const initial = (seed: string) => createCareerGame(country, {
  seed, name: 'Ana Rivas', age: 34, originId: 'professional-middle', professionId: 'teacher',
  educationId: 'public-university', districtId: country.electoralDistricts[0]!.id,
});
let game = nominate(initial('audit-play-1'));
for (let week = 0; week < 4; week++) {
  game = performCampaignAction(game, 'rally');
  game = performCampaignAction(game, 'rally');
  game = advanceCareer(game, country);
}
const campaign = { elected: game.electionOutcome?.elected, pending: game.inbox.filter(item => !item.resolved).length, preference: game.campaign.playerPreferencePercent };
let legislation = null;
if (game.electionOutcome?.elected) {
  const sitting = advanceCareer(game, country);
  const yes = castVote(sitting, 'yes');
  const no = castVote(sitting, 'no');
  const skipped = advanceCareer(sitting, country);
  legislation = {
    proposal: sitting.legislature?.currentProposal?.title,
    yesPassed: yes.legislature?.voteHistory.at(-1)?.passed,
    noPassed: no.legislature?.voteHistory.at(-1)?.passed,
    yesEconomicIndicatorsUnchanged: JSON.stringify(yes.world.economy) === JSON.stringify(sitting.world.economy),
    noEconomicIndicatorsUnchanged: JSON.stringify(no.world.economy) === JSON.stringify(sitting.world.economy),
    yesApprovalDelta: yes.world.approvalPercent - sitting.world.approvalPercent,
    noApprovalDelta: no.world.approvalPercent - sitting.world.approvalPercent,
    skippedVoteRecords: skipped.legislature?.voteHistory.length,
    skippedNextProposal: skipped.legislature?.currentProposal?.title,
  };
}
const budgetGame = initial('audit-budget-1');
const chamberId = country.politicalSystem.legislature.lowerChamber.id;
const members = budgetGame.world.legislators.filter(member => member.chamberId === chamberId);
// Evaluate the exact existing budget affinity formula on a fixed chamber.
// This is a diagnostic of its monotonicity, not a complete government run.
const budget = [25, 50, 75].map(position => {
  const votedYes = members.filter(member => {
    const party = budgetGame.world.parties.find(entry => entry.id === member.partyId);
    const affinity = (position - member.ideology.economy) * .55;
    const partyCoordination = ((party?.ideology.economy ?? member.ideology.economy) - position) * .12 * (party?.discipline ?? 50) / 100;
    const score = 50 + affinity - partyCoordination + (member.loyalty - 50) * .04;
    return score >= 50;
  });
  return { position, yes: votedYes.length, members: members.length, economyBelow40Yes: votedYes.filter(member => member.ideology.economy < 40).length, economyBelow40Members: members.filter(member => member.ideology.economy < 40).length };
});
console.log(JSON.stringify({ catalogue: { templates: careerEventCatalog.length, variants: careerEventCatalog.reduce((sum, event) => sum + event.variants.length, 0), arcs: careerEventArcsComplete.length, genericByDefault: generic.length }, campaign, legislation, budget }, null, 2));
