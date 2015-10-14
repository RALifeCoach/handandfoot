var PersonVM = function() {
};

PersonVM.prototype.mapToVM = function(person) {
	return {
		_id: person._id,
		name: person.name,
	};
};

module.exports.PersonVM = PersonVM;
