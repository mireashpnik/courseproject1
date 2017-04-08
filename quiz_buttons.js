$('#button_start').click(function() {
	LoadQuestions();
});

$('#button_back').click(function(){
	ShowQuestion(current_quest - 1);
});

$('#button_submit').click(function(){
	SendAnswer();
});

$('#button_skip').click(function(){
	ShowQuestion(current_quest + 1);
});

$('#button_review').click(function(){
	ShowReview();
});

$('#button_finish').click(function(){
	Finish();
});

