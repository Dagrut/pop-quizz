var exp = {};

exp.title = "Quizz du 01/01/2000";
exp.markBase = 20; // The note will be on 20
exp.duration = 30; // In minutes
exp.qshuffle = true; // Should we shuffle questions? Defaults to true
exp.ashuffle = true; // Should we shuffle answers in each question? Defaults to true
/*
  Contains the groups that we should shuffle (each question or response in the same group are kept in the order they are in, by default)
  All values in this object should be the same (all true or all false): 
  - If They are all true,  the default value for other groups will be false
  - If They are all false, the default value for other groups will be true
  Mixed value can lead to unpredictable behavior!
  Empty or inexistant gshuffle key will lead to keep every group sorted (equivalent to false for all groups)
  gshuffle can also be true or false itself, to be applied on every groups at the same time
  qshuffle and ashuffle will take precedence over gshuffle */
exp.gshuffle = {
	qelecP: true, // Here we ask to shuffle these 3 groups, but keep other groups sorted
	qelecR: true,
	qelecU: true,
};

exp.questions = [
	{
		title: "Is this question using `<html>` characters?",
		choices: [
			{ ok: true,  text: "<code>yes</code>" },
			{ ok: false, text: "Nope" },
		],
		grp: "group1", // You can define a group inside a question or an answer, so these elements (of the same kind) will be kept together AND ALSO in the same order!
	},
	{
		title: "An other easy question : What is the?",
		radio: true, // Will show radio buttons for this question.
		choices: [
			{ ok: true,  grp: "keep this order", text: "42" },
			{ ok: false, grp: "up or down, not in between", text: "I know but I won't say" },
			{ ok: false, grp: "keep this order", text: "I don't know" },
		],
		grp: "group1",
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
		points: 15, /* This question is worth 15 points. If not specified, questions are worth 1 point each */
	},
	{
		title: "Check the correct answers :",
		choices: [
			{ ok: true,  grp: "qelecP", text: "`P = U×I`" },
			{ ok: true,  grp: "qelecR", text: "`R = U×I`" },
			{ ok: true,  grp: "qelecU", text: "`U = R×I`" },
			{ ok: false, grp: "qelecU", text: "`U = R÷I`" },
			{ ok: false, grp: "qelecP", text: "`P = R×U`" },
			{ ok: false, grp: "qelecR", text: "`R = I÷P`" },
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
