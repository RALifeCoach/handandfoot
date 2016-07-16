export default class PersonVM {
    static mapToVM(person) {
        return {
            _id: person._id,
            name: person.name
        };
    }
}
