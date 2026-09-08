/**
 * cardMapping.js
 * 52-Card Deck Mapping
 * Maps card IDs 1..52 to custom Discord emojis (static & animated)
 * and universal text/Unicode representations (e.g. `[A♠]`, `[K♥]`).
 */

const cardsStatic = [
	'<:cardback:457084762230751254>', // 0: back
	'<:as:457412291457974272>', // 1: Ace of Spades
	'<:2s:457412287372722176>', // 2
	'<:3s:457412291382738954>', // 3
	'<:4s:457412290988343296>', // 4
	'<:5s:457412291059646465>', // 5
	'<:6s:457412291303047208>', // 6
	'<:7s:457412291302916096>', // 7
	'<:8s:457412291004989441>', // 8
	'<:9s:457412291378413578>', // 9
	'<:10s:457412291093069826>', // 10
	'<:js:457412291881598988>', // 11: Jack of Spades
	'<:qs:457412292007690251>', // 12: Queen of Spades
	'<:ks:457412292015816720>', // 13: King of Spades
	'<:ac:457412292238114826>', // 14: Ace of Clubs
	'<:2c:457412287389630475>', // 15
	'<:3c:457412291764420608>', // 16
	'<:4c:457412291290464267>', // 17
	'<:5c:457412291655106561>', // 18
	'<:6c:457412292166811659>', // 19
	'<:7c:457412292083187743>', // 20
	'<:8c:457412291780935691>', // 21
	'<:9c:457412291651043329>', // 22
	'<:10c:457412291877404674>', // 23
	'<:jc:457412292359880716>', // 24: Jack of Clubs
	'<:qc:457412292469063682>', // 25: Queen of Clubs
	'<:kc:457412292577853441>', // 26: King of Clubs
	'<:ah:457412292972249093>', // 27: Ace of Hearts
	'<:2h:457412292766597140>', // 28
	'<:3h:457412292758470659>', // 29
	'<:4h:457412293056266250>', // 30
	'<:5h:457412293223776287>', // 31
	'<:6h:457412292993351682>', // 32
	'<:7h:457412293232164865>', // 33
	'<:8h:457412293207130123>', // 34
	'<:9h:457412293253267466>', // 35
	'<:10h:457412293236621312>', // 36
	'<:jh:457412293039226892>', // 37: Jack of Hearts
	'<:qh:802675572836532254>', // 38: Queen of Hearts
	'<:kh:457412293261524997>', // 39: King of Hearts
	'<:ad:802675572143554601>', // 40: Ace of Diamonds
	'<:2d:457412292116611084>', // 41
	'<:3d:457412292938563604>', // 42
	'<:4d:457412292775116800>', // 43
	'<:5d:457412293244747791>', // 44
	'<:6d:457412293068718103>', // 45
	'<:7d:457412293253267476>', // 46
	'<:8d:457412292976574476>', // 47
	'<:9d:457412293257330688>', // 48
	'<:10d:457412292871585794>', // 49
	'<:jd:457412292917854223>', // 50: Jack of Diamonds
	'<:qd:457412292980637729>', // 51: Queen of Diamonds
	'<:kd:802675572428767294>', // 52: King of Diamonds
];

const suitsSymbol = ['♠', '♣', '♥', '♦'];
const rankLabels = ['K', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q'];

/**
 * Get card display
 * @param {number} cardId - 1 to 52 (0 or hidden = cardback)
 * @param {boolean} [hidden=false]
 * @param {'discord'|'unicode'} [mode='discord']
 * @returns {string}
 */
function getCardDisplay(cardId, hidden = false, mode = 'discord') {
	if (hidden || cardId <= 0 || cardId > 52) {
		return mode === 'discord' ? cardsStatic[0] : '🎴 [?]';
	}

	if (mode === 'discord') {
		return cardsStatic[cardId] || `[${cardId}]`;
	}

	const rankIndex = cardId % 13;
	const suitIndex = Math.floor((cardId - 1) / 13);
	return `[${rankLabels[rankIndex]}${suitsSymbol[suitIndex]}]`;
}

module.exports = {
	cardsStatic,
	getCardDisplay,
};
