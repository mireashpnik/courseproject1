var questions = [];
var current_quest = -1;
var test_finished = false;

function Option(id, text, selected) {
	this.id = id;
	this.text = text;
	this.selected = selected;
}

function Question(number, id, text, type, written, points, max_points) {
	this.number = number;
	this.id   = id;
	this.text = text;
	this.type = type;
	this.written = written;
	this.points = points;
	this.max_points = max_points;
	
	this.addOption = function(option) {
		if(this.options) {
			this.options.push(option);
		} else {
			this.options = [option];
		}
	};
	
	// Добавляет HTML код вопроса в блоки content, left_menu и review
	this.print = function(option) {
		console.log(this);
		
		// Блок с текстом вопроса
		var $block = $('<div id="quest' + this.number + '" class="quest_block"></div>');
		$block.append('<input type="hidden" name="id" value="' + this.id + '" />');
		$block.append('<p class="lead">' + this.text + '</p>');
		
		// Блок с вариантами ответов
		var $options = $('<form target="api/set_answer.json" method="POST"></form>');
		var answered = false;
		if(this.written && this.written.length > 0) {
			answered = true;
		}
		if(this.type == "string") {
			$options.append('<div class="well"><input type="text" class="form-control" width="200px" value="' + this.written + '" /></div>');
		} else {
			$ul = $('<ul class="list-group"></ul>');
			var option_type = this.type == "oneselect" ? 'radio': 'checkbox';
			var prefix = "quest" + this.number;
			$.each(this.options, function( _, option ) {
				var selected = option.selected ? 'checked': '';
				if(option.selected) {
					answered = true;
				}
				$ul.append('<li class="list-group-item"><input id="' + prefix + '_option' + this.id + '" name="' + prefix + '_options" type="' + option_type + '" ' + selected + '> ' + option.text + "</li>");
			});
			$options.append($ul);
		}
		$block.append($options);
		$('#question_data').append($block);
		
		// Кнопка в левом меню
		var $button = $('<button  class="btn btn-default" id="button_quest' + this.number + '">' + (this.number + 1) + '</button>');
		$button.click(function() {
			ShowQuestion($button.html() - 1);
		});
		$('#left_menu').append($button);
		
		// Строка в обзоре
		var review_style = '';
		var save_text = '';
		if(test_finished) {
			if(this.points < this.max_points) {
				review_style = 'list-group-item-danger';
				save_text = 'неправильно';
			} else {
				review_style = 'list-group-item-success';
				save_text = 'правильно';
			}
		}
		if(!test_finished) {
			save_text = answered ? ' ответ уже получен': 'ожидает ответа';
		}
		var $review = $('<li id="review_quest' + this.number + '" class="list-group-item ' + review_style + '">Вопрос ' + (this.number + 1) + ': ' + save_text + '.</li>');
		$('#review>ul').append($review)
	}
}



// Загружаем список вопросов
function LoadQuestions() {
	$('#question_data').html('');
	$('#left_menu').html('');
	$('#review>ul').html('');
	// Если тестирование завершено, отправляем запрос и получаем список вопросов с ответами и результатом. Иначе, только вопросы.
	var url = test_finished ? 'api/finish.json': 'api/get_quests.json';
	$.getJSON(url, PrintQuestions);
}

// Выводит вопросы в интерфейс
function PrintQuestions(data) {
	console.log(data);
	var n = 0;
	$.each( data, function( _, question_data ) {
		var question = new Question(n, question_data["id"], question_data["question"], question_data["type"], question_data["written"], question_data["points"], question_data["max_points"]);
		$.each( question_data["options"], function( _, option ) {
			var option = new Option(option["id"], option["text"], option["selected"]);
			question.addOption(option);
		});
		question.print();
		questions.push(question);
		n++;
	});
	
	// Добавляем кнопку "Обзор"
	review = $('<button class="btn btn-default">Обзор</button>');
	review.click(ShowReview);
	$('#left_menu').append(review);
	
	// Если тестирование завершено, показываем финальный обзор с результатами. Если нет, то первый вопрос.
	if(test_finished) {
		ShowReview();
	} else {
		ShowQuestion(0);
	}
}
	

// Перейти к вопросу номер N. Если данного вопроса не существует, перейти к обзору
function ShowQuestion(n) {
	if ( !$('#quest' + n).length ) {
		return ShowReview();
	}
	$('#welcome').hide();
	$('#review').hide();
	$('#content').show();
	$('#question_data').children().hide();
	$('#navigation').show();
	$('#quest' + n).show();
	current_quest = parseInt(n);
}

// Перейти к обзору
function ShowReview() {
	$('#welcome').hide();
	$('#content').hide();
	$('#review').show();
}

// Отправить результаты
function SendAnswer() {
	var question = questions[current_quest]
	
	// Сохраняем данные из формы в переменную data
	var data = {
		"id": question.id
	}
	if(question.type == 'string') { // Тип вопроса - строка
		data['written'] = $('#quest' + current_quest + '>form>div>input').val();
		if(data['written'].length < 1) {
			alert("Введите ответ");
			return;
		}
	} else { // Тип вопроса: один или несколько вариантов
		data['options'] = [];
		$.each( $('#quest' + current_quest + '>form>ul>li>input:checked'), function(_, val) {
			data['options'].push($(val).attr('id'));
		});
		if (data['options'].length < 1) {
			alert("Нужно хоть что-то выбрать");
			return;
		}
	}
	console.log(data);

	// Отправляем запрос
	$.ajax({
		async: true,
		url: 'api/set_answer.json',
		type: 'POST',
		data: JSON.stringify(data),
		contentType: 'application/json; charset=utf-8',
		dataType: 'json',
		success: function(msg) {
			console.log(msg);
		},
		error: function(msg) {
			console.log(msg);
			console.log("Что-то пошло не так...");
			// github pages не разрешает использовать метод POST.
			// на демонстрацию это никак не влияет, но в реальных условиях, данную ошибку нужо обрабатывать. 
		}
	});
	
	// Меняем цвет кнопки в левом меню
	$('#button_quest' + current_quest).addClass('btn-success');
	// Меняем запись в Обзоре
	$('#review_quest' + current_quest).html('Вопрос ' + (current_quest + 1) + ': ответ сохранен.');
	// Переходим к следующему вопросу
	ShowQuestion(current_quest + 1);
}

// Отправить сообщение о завершении тестирования
function Finish() {
	test_finished = true;
	$('#button_finish').hide();
	$('#navigation').hide();
	$('#left_menu').hide();
	LoadQuestions();
}


