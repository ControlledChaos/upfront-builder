;(function ($, undefined) {

function show_error (msg) {
	msg = msg || ((_thx || {}).l10n || {}).oops;
	if (!msg) return false;

	hide_errors();

	$(".upfront_admin.upfront-builder h1").after(
		'<div class="error after-h2 upfront-error"><p>' + msg + '</p></div>'
	);

	return true;
}

function hide_errors () { return $(".upfront_admin.upfront-builder .upfront-error").remove(); }

function edit_theme (theme) {
	var search = window.location.search.toString(),
		url = (window._thx || {}).editor_base.replace(/\/theme/, '/' + theme)
	;
	if (!url) return false;

	hide_errors();

	if (search.length && search.match(/[?&]dev=/)) {
		url += '?dev=true';
	}
	window.location.assign(url);
}

function get_data (new_theme) {
	new_theme = undefined === new_theme ? true : new_theme; // Do *not* use ES6 syntax for defaults
	var data = {},
		$ins = ( new_theme )
			? $("#new-theme input, #new-theme textarea, #new-theme select")
			: $("#edit-theme input, #edit-theme textarea, #edit-theme select")
	;
	$ins.each(function () {
		var $me = $(this),
			idx = $me.attr("id"),
			value = $me.is(":checkbox") ? $me.is(":checked") : $me.val()
		;
		data["thx-" + idx] = value;
	});
	return data;
}

function init_new () {
	var frame,
		$screenshot = $(".uf-thx-theme_screenshot").find('img'),
		$selected = $("#existing-theme").find('.uf-thx-theme.selected'),
		$name = $selected.find('.uf-thx-caption > span').text();

	$("#existing-theme .theme-name").html($name);

	if ($screenshot.attr("src")) { $screenshot.addClass('nostyle'); }

	$("#new-theme")
		.on("click", "button.create.theme", function (e) {
			e.preventDefault();
			e.stopPropagation();

			var data = get_data(true),
				base_url = (window._thx || {}).editor_base || window.location.pathname,
				slug
			;
			if ('thx-theme-slug' in data) {
				slug = data['thx-theme-slug'];
			}
			data.add_global_regions = true;

			hide_errors();

			$.post(_thx.admin_ajax, {
				action: 'upfront_thx-create-theme',
				mode: "theme",
				form: _.map(data, function(value, key){ return key + '=' + escape(value); }).join('&')
			}).success(function(response) {
				if (!slug && response && "theme" in response) {
					slug = (response.theme || {directory: false}).directory;
				}
				if (slug) window.location = base_url.replace(/\/theme/, '/' + slug);
				else window.location.reload();
			}).error(function(){
				show_error();
			});

			return false;
		})
	;
}

function init_existing () {
	$("#existing-theme")
		.find(".uf-thx-theme a").click(function (e) {
			e.preventDefault();
			e.stopPropagation();

			return false;
		})
		.on("click", "button.edit.info", function (e) {
			e.preventDefault();
			e.stopPropagation();

			var $edit_form = $('#edit-theme'),
				$edit_form_content = $edit_form.find('.form_content'),
				$edit_form_container = $edit_form.closest('.postbox-modal-container'),
				selected_theme = $(e.target).closest('.uf-thx-theme').attr('data-theme')
			;

			$.post(_thx.admin_ajax, {
				action: 'upfront_thx-get-edit-theme-form',
				mode: "theme",
				selected: selected_theme,
			}).success(function(response) {
				$edit_form_content.html(response);
				$edit_form_container.show();
			}).error(function(){
				show_error();
			});

			return false;
		})
		.on("click", "button.edit.theme", function (e) {
			e.preventDefault();
			e.stopPropagation();

			var current = $(e.target).closest('.uf-thx-theme').attr('data-theme');
			if (!current) return false;

			edit_theme(current);

			return false;
		})
		.on("click", "button.download", function (e) {
			e.preventDefault();
			e.stopPropagation();

			var current = $(e.target).closest('a').attr('data-download_url');
			if (!current) return false;

			window.location = current;

			return false;
		})
	;
	$(".postbox-modal-container")
		.on("click", "#postbox-modal-close", function (e) {
			e.preventDefault();
			e.stopPropagation();

			var $edit_form = $('#edit-theme'),
				$edit_form_content = $edit_form.find('.form_content'),
				$edit_form_container = $edit_form.closest('.postbox-modal-container')
			;

			$edit_form_content.html('');
			$edit_form_container.hide();

			return false;
		})
		.on("click", "button.edit.info", function (e) {
			e.preventDefault();
			e.stopPropagation();

			var data = get_data(false);
			if (!data['thx-theme-slug']) return false;

			data.add_global_regions = true;

			hide_errors();

			$.post(_thx.admin_ajax, {
				action: 'upfront_thx-update-theme',
				mode: "theme",
				form: _.map(data, function(value, key){ return key + '=' + escape(value); }).join('&')
			}).success(function(response) {
				window.location.reload();
			}).error(function(){
				show_error();
			});

			return false;
		})
		.on("click", ".uf-thx-theme_screenshot button.change-image", function (e) {
			e.preventDefault();
			e.stopPropagation();

			var frame,
				$me = $(this).closest('.uf-thx-theme_screenshot'),
				$img = $me.find("img"),
				$use = $me.find('#theme-screenshot')
			;

			if (frame) {
				frame.open();
				return false;
			}

			frame = wp.media({
				title: 'Select or Upload Media Of Your Chosen Persuasion',
				library: {
		      	type: 'image'
		   	},
				button: {
					text: 'Use this media'
				},
				multiple: false  // Set to true to allow multiple files to be selected
			});

			frame.on("select", function () {
				var img = frame.state().get('selection').first().toJSON(),
					url = (img || {}).url || false,
					id = (img || {}).id || false
				;
				if (!url || !id) return false;

				$use.val(id);
				$img.attr("src", url);
				$img.addClass('nostyle');
			});

			frame.open();

			return false;
		})
	;
}

function init () {
	if (this._initialized) {
		return false;
	}
	this._initialized = true;
	init_new();
	init_existing();
}

$(init);

})(jQuery);
