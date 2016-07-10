export default class PersonVM {
    constructor () {

    }

    static mapToVM(person) {
        return {
            _id: person._id,
            name: [erson.name]
        };
    }
}
