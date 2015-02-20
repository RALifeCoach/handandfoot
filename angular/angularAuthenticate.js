'use strict';

// authenticate factory
angular.module('handAndFoot')
	.factory('authenticate', ['$http', 
		'sharedProperties',
		function($http, sharedProperties){
			// return true if the person exists (it will be fetched from cookies first time in)
			var authenticated = function() {
				return sharedProperties.getPerson ? true : false;
			}
			
			// save the authenticated person
			var savePerson = function(person) {
				sharedProperties.setPerson(person);
			};
 
			// prepare call for login
			var signIn = function (userData) {
				var promise = $http.post("/login", userData);
				return promise;
			};
		 
			// prepare call for logout
			var signOut = function () {
				sharedProperties.setPerson(null);
				return;
			};
		 
			// register new user
			var register = function (userData) {
				var promise = $http.post("/register", userData);
				return promise;
			}
		 
			return {
				signIn: signIn,
				signOut: signOut,
				isAuthenticated: authenticated,
				savePerson: savePerson,
				register: register
			}
		}
	]);

// controller for authentication view
angular.module('handAndFoot')
	.controller('AuthenticateCtrl', ['$scope', 
		'$location', 
		'authenticate',
		'sharedProperties',
		function ($scope, $location, authenticate, sharedProperties) {
			var isSignedIn = false;
		 
			$scope.isError = false;
		 
			$scope.user = { name: '', userId: '', password: '' , confirmPassword: '', failed: false};
			
			// sign out
			$scope.signOut = function () {
				var promise = authenticate.signOut();
				promise.success(function () {
					authenticate.isAuthenticated = false;
				}).error(function (status, data) {
					console.log(status);
                    console.log(data);
				});
			};
			
			// sign in
			$scope.signIn = function () {
				sharedProperties.setPerson(null);
				var promise = authenticate.signIn($scope.user);
				promise.success(function (data, status, header) {
					if (data.error) {
						$scope.user.userId = '';
						$scope.user.password = '';
						$scope.user.failed = true;
					} else {
						authenticate.isAuthenticated = true;
						$location.path( "/games" );
						$scope.user.failed = false;
						authenticate.savePerson(data.person);
					}
				}).error(function (status, data) {
					console.log(status);
                    console.log(data);
				});
			};
			
			// register user contains id (email), password and name
			$scope.register = function () {
				sharedProperties.setPerson(null);
				var promise = authenticate.register($scope.user);
				promise.success(function (data, status, header) {
					if (data.error) {
						$scope.user.failed = data.error;
						authenticate.isAuthenticated = false;
						authenticate.savePerson(data.person);
					} else {
						authenticate.isAuthenticated = true;
						$location.path( "/games" );
						$scope.user.failed = false;
						authenticate.savePerson(data.person);
					}
				}).error(function (status, data) {
					console.log(status);
                    console.log(data);
				});
			};
		}
	]);
