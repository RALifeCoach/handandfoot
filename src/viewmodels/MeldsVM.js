import MeldVM from './MeldVM';

export default class MeldsVM {
    constructor(melds) {
        this.melds = melds.map(meld => {
            return new MeldVM(meld)
        });
    }

    // move meld data from gameVM to game
    unloadTo(updatePlayers, outMelds) {
        // create a map of the outMelds
        const mapMelds = {};
        outMelds.forEach(meld => {
            mapMelds[meld._id.toString()] = meld;
        });
        // update melds for melds in both versions
        // there will always be the same or more melds in this class than
        // in the outMelds - loop through them, look for a match, if not found
        // add it
        const results = [];
        this.melds.forEach(inMeld => {
            let outMeld = mapMelds[inMeld.meldId];
            if (!outMeld) {
                updatePlayers = true;
                outMeld = {
                    type: inMeld.type,
                    number: inMeld.number,
                    isComplete: inMeld.isComplete,
                    cards: inMeld.cards.serialize()
                };
            } else if (outMeld.cards.length !== inMeld.cards.length) {
                updatePlayers = true;
                outMeld.cards = inMeld.cards.serialize();
            }
            results.push(outMeld);
        });

        // now refill the outMeld
        outMelds.splice(0, outMelds.length);
        results.forEach(meld => outMelds.push(meld));
        return updatePlayers;
    }
}
