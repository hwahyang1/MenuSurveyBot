// 1. JQuery 쓰기 싫었음.. 다시 쓸 줄은 몰랐네
// 2. TS 쓰고 싶어요 타입 없으니까 되게 불안함

$(document).ready(() => {
	setSpinnerEnable(true);

	init();

	getSessionInfo();
});

let init = () => {
	$('.modal').modal({ dismissible: false });
	$('.collapsible').collapsible({ accordion: false });
};

let destroy = () => {
	try {
		$('.modal').modal('destroy');
		$('.collapsible').collapsible('destroy');
	} catch (e) {
		console.warn(e);
	}
};

let setSpinnerEnable = (enable) => {
	if (enable) {
		$('html, body').addClass('hidden');
		$('body')
			.addClass('scrollDisable')
			.on('scroll touchmove mousewheel', (e) => {
				e.preventDefault();
			});
		$('.overlay').show();
	} else {
		$('html, body').removeClass('hidden');
		$('body').removeClass('scrollDisable').off('scroll touchmove mousewheel');
		$('.overlay').hide();
	}
};

let showModal = (title, message, showCloseButton = false) => {
	if (showCloseButton) $('#infoClose').show();
	else $('#infoClose').hide();

	$('.overlay').css('z-index', 512);
	$('#infoTitle').html(title);
	$('#infoDescription').html(message);
	$('#info').modal('open');
};

let checkboxValueChanged = () => {
	$('#totalBody').html('');
	$('#totalPrice').html('0원');

	let selected = $("input[name='menuElement']:checked")
		.map(function () {
			return this.dataset;
		})
		.get();

	let totalPrice = 0;
	let tableBody = '';
	selected.forEach((target) => {
		tableBody += `<tr><td>${target.store}</td><td>${target.name}</td><td>${target.price
			.toString()
			.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원</td></tr>`;
		totalPrice += parseInt(target.price);
	});

	$('#totalBody').html(tableBody);
	$('#totalPrice').html(`${totalPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원`);
};

let getSessionInfo = () => {
	setSpinnerEnable(true);

	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);

	$.ajax({
		type: 'GET',
		url: '/api/v1/sessionInfo',
		data: { session: urlParams.get('s') },
		error: (xhr, status, errorThrown) => {
			setSpinnerEnable(false);
			$('title').text($(document).attr('title').replace('{GroupName}', undefined));
			const res = JSON.parse(xhr.responseText);
			showModal(
				'에러',
				`서버와의 통신에 실패했습니다.<br><p class="orange-text orange-darken-3">(${res.code} ${res.description}) ${res.userDescription}</p>`
			);
		},
		success: applySessionData,
	});
};

let zeroFill = (number, limit) => ('00000000' + number).slice(-limit);

let applySessionData = (res) => {
	setSpinnerEnable(true);
	destroy();

	const deadline = new Date(res.group.deadlineTimestamp * 1000);
	const year = deadline.getFullYear();
	const month = deadline.getMonth() + 1;
	const date = deadline.getDate();
	const hour = deadline.getHours();
	const minute = deadline.getMinutes();
	const second = deadline.getSeconds();

	$('title').text($(document).attr('title').replace('{GroupName}', res.group.name));

	$('#formTitle').html($('#formTitle').html().replace('{GroupName}', res.group.name));
	$('#formDescription').html(
		$('#formDescription').html().replace('{DiscordName}', res.session.userName)
	);

	$('#groupInfo').html($('#groupInfo').html().replace('{GroupId}', res.group.groupId));
	$('#groupInfo').html($('#groupInfo').html().replace('{GroupName}', res.group.name));
	$('#groupInfo').html(
		$('#groupInfo').html().replace('{MaxParticipants}', res.group.maxParticipants)
	);
	$('#groupInfo').html(
		$('#groupInfo')
			.html()
			.replace(
				'{Deadline}',
				`${zeroFill(year, 4)}-${zeroFill(month, 2)}-${zeroFill(date, 2)} ${zeroFill(
					hour,
					2
				)}:${zeroFill(minute, 2)}:${zeroFill(second, 2)}`
			)
	);

	$('#menuLists').html('');
	menuListsString = '';
	res.group.menus.forEach((target) => {
		menuListsString += `<li><div class="collapsible-header"><i class="material-icons">arrow_drop_down</i>${target.storeName}</div><div class="collapsible-body">`;
		for (let i = 0; i < target.menus.length; i++) {
			menuListsString += `<p><label><input type="checkbox" class="filled-in" name="menuElement" onClick="checkboxValueChanged();" data-store="${
				target.storeName
			}" data-name="${target.menus[i]}" data-price="${
				target.prices[i]
			}" /><span class="black-text">${target.menus[i]} (${target.prices[i]
				.toString()
				.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원)</span></label></p>`;
			if (i !== target.menus.length - 1) menuListsString += '<br>';
		}
		menuListsString += '</div></li>';
	});
	$('#menuLists').html(menuListsString);

	$('#confirmDescription').html(
		$('#confirmDescription').html().replace('{BankAccount}', res.bankAccount)
	);

	$('#totalBody').html('');
	$('#totalPrice').html('0원');

	init();
	setSpinnerEnable(false);
};

let submitForm = () => {
	$('#submit').modal('close');
	setSpinnerEnable(true);

	let selected = $("input[name='menuElement']:checked")
		.map(function () {
			return this.dataset;
		})
		.get();

	if (selected.length === 0) {
		setSpinnerEnable(false);
		showModal('알림', '한 개 이상의 항목을 선택해야 합니다.', true);
		return;
	}

	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);

	let menus = new Array();
	selected.forEach((target) => {
		menus.push(`${target.store}|${target.name}`);
	});

	$.ajax({
		type: 'POST',
		url: '/api/v1/submit',
		data: { session: urlParams.get('s'), menus: menus },
		error: (xhr, status, errorThrown) => {
			setSpinnerEnable(false);
			const res = JSON.parse(xhr.responseText);
			showModal(
				'에러',
				`서버와의 통신에 실패했습니다.<br><p class="orange-text orange-darken-3">(${res.code} ${res.description}) ${res.userDescription}</p>`,
				true
			);
		},
		success: (res) => {
			setSpinnerEnable(false);
			showModal('성공', '성공적으로 모임에 참여했습니다.<br>본 화면을 닫으셔도 됩니다.');
		},
	});
};
