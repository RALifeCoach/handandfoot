import MeldVM from './MeldVM';

export default class MeldsVM {
    constructor(melds) {
        this.melds = melds.map(meld => {
            return new MeldVM(meld)
        });
    }

    // move meld data from gameVM to game
    unloadTo(updatePlayers, outMelds) {
        var updatePlayers = false;

        // create a map of the outMelds
        let mapMelds = new WeakMap();
        outMelds.forEach(meld => mapMelds.put(meld._id, meld));
        // update melds for melds in both versions
        // ther will always be the same or more melds in this class than
        // in the outMelds - loop through them, look for a match, if not found
        // add it
        let results = [];
        this.melds.forEach(inMeld => {
            let outMeld = mapMelds.get(meld._id);
            if (!outMeld) {
                updatePlayers = true;
                outMeld = {
                    type: inMeld.type,
                    number: inMeld.number,
                    isComplete: inMeld.isComplete,
                    cards: inMeld.cards.deserialize()
                };
                results.push(outMeld);
            } else if (outMeld.cards.length !== inMeld.cards.length) {
                updatePlayers = true;
                outMeld.cards = inMeld.cards.deserialize();
            }
        });

        // now refill the outMeld
        outMelds.splice(outMelds.length);
        results.forEach(meld => outMeld.push(meld));
        return updatePlayers;
    }
}
