var exp = {};

exp.title = "Quizz du 01/01/2000";
exp.markBase = 20; // The note will be on 20
exp.duration = 30; // In minutes
exp.questions = [
	{
		title: "Is this question using `<html>` characters?",
		choices: [
			{ ok: true,  text: "<code>yes</code>" },
			{ ok: false, text: "Nope" },
		],
	},
	{
		title: "An other easy question : What is the?",
		choices: [
			{ ok: true,  text: "42" },
			{ ok: false, text: "I know but I won't say" },
			{ ok: false, text: "I don't know" },
		],
	},
	{
		title: "1 + 1 = ?",
		choices: [
			{ ok: true,  text: "2" },
			{ ok: true,  text: "Square root of 4" },
			{ ok: true,  text: "Not 69" },
			{ ok: false, text: "3.141" },
			{ ok: false, text: "The moon" },
			{ ok: true,  text: "Cubic root of 8" },
		],
	},
];

exp.oninit = function() {
	console.log('This function will be executed when ready');
};

exp.onquizz = function() {
	console.log('This function will be executed when the quizz was just displayed');
};

exp.onsolve = function() {
	console.log('This function will be executed when the quizz solution was just displayed');
};

module.exports = exp;
