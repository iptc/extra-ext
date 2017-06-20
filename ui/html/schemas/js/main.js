$(function () {
    $.ajax({
        type: "GET",
        url: "http://" + window.location.hostname + ":8888/extra/api/schemas?nPerPage=100",
        dataType: "json",
        success: function (json) {
            for (var i = 0; i < json.entries.length; i++) {
                $('#schemas_result').append('<div class="schema" data-id="' + json.entries[i].id + '"><img class="delete_icon" src="imgs/delete.png"><p class="title_schema">' + json.entries[i].name + '-' + json.entries[i].language + '</p><p class="schema_num">fields: ' + json.entries[i].fieldNames.length + '</p></div>')
            }
        },
        async: true
    });
    var width = 220,
        height = 40 * 5,
        speed = 300,
        button = $('#hamburger-icon'),
        overlay = $('#overlay'),
        menu = $('#hamburger-menu');

    button.on('click', function (e) {
        if (overlay.hasClass('open')) {
            animate_menu('close');
        } else {
            animate_menu('open');
        }
    });

    overlay.on('click', function (e) {
        if (overlay.hasClass('open')) {
            animate_menu('close');
        }
    });

    $('a[href="#"]').on('click', function (e) {
        e.preventDefault();
    });

    function animate_menu(menu_toggle) {
        $('#hamburger-icon').toggleClass('active');
        if (menu_toggle == 'open') {
            overlay.addClass('open');
            button.addClass('on');
            overlay.animate({opacity: 1}, speed);
            menu.animate({width: width, height: height}, speed);
        }

        if (menu_toggle == 'close') {
            button.removeClass('on');
            overlay.animate({opacity: 0}, speed);
            overlay.removeClass('open');
            menu.animate({width: "0", height: 0}, speed);
        }
    }

    $("#schemas_result").on("click", ".schema", function () {
        $('#zero_fields').hide();
        $('#fields_result ul').empty();
        $.ajax({
            type: "GET",
            url: "http://" + window.location.hostname + ":8888/extra/api/schemas/" + $(this).attr('data-id'),
            dataType: "json",
            success: function (json) {
                $('#new_field').removeAttr('disabled');
                for (var i = 0; i < json.fields.length; i++) {
                    $('#fields_result ul').append('<li><span class="field_title">' + json.fields[i].name + '</span><img class="delete_field" src="imgs/delete.png"><div class="field"><span class="property">textual</span>: <span class="type-boolean">' + json.fields[i].textual + '</span>,</div><div class="field"><span class="property">hasSentences</span>: <span class="type-boolean">' + json.fields[i].hasSentences + '</span>,</div><div class="field"><span class="property">hasParagraphs</span>: <span class="type-boolean">' + json.fields[i].hasParagraphs + '</span></div></li>');
                }
                $('#schemas_result').removeClass('disabled_schema');
                if (json.fields.length === 0) {
                    $('#zero_fields').show();
                }
            },
            async: true
        });
        $('#schema_name').html($(this).find('.title_schema').text());
        $('.schema').removeClass('highlight_schema');
        $(this).addClass('highlight_schema');
    });
});

$('#new_schema').click(function () {
    $('#new_schema_name').removeClass('missing').val("");
    $('#myModal').reveal();
});
$("#schemas_result").on("click", ".delete_icon", function (e) {
    e.stopPropagation();
    $(this).parent('div').addClass('deleted_selection_schema');
    $("#delete_edit").attr('data-ref', 'schema');
    $("#delete_message").slideDown();
});
$("#delete_edit").click(function () {
    if ($(this).attr('data-ref') === "field") {
        var viewData = {
            "name": $('#schema_name').text().substr(0, $('#schema_name').text().lastIndexOf('-')),
            "language": $('#schema_name').text().substr($('#schema_name').text().lastIndexOf('-') + 1),
            "fields": []
        };

        $("#fields_result ul li:not(.deleted_selection)").each(function () {
            viewData.fields.push({
                "name": $(this).find('.field_title').text(),
                "textual": $(this).find('.field').eq(0).find('.type-boolean').text() == 'true',
                "hasSentences": $(this).find('.field').eq(1).find('.type-boolean').text() == 'true',
                "hasParagraphs": $(this).find('.field').eq(2).find('.type-boolean').text() == 'true'
            });
        });
        var data = JSON.stringify(viewData);
        console.log(data);
        $.ajax({
            type: 'PUT',
            url: 'http://' + window.location.hostname + ':8888/extra/api/schemas/' + $('.highlight_schema').attr('data-id'),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: data,
            success: function () {
                $('.highlight_schema').find('.schema_num').text("fields: " + (($('.highlight_schema').find('.schema_num').text().split(' ')[1]) - 1));
                $("#delete_message").slideUp();
                $('.deleted_selection').remove();
                if ($('#fields_result ul li').length === 0) {
                    $('#zero_fields').show();
                }
            },
            error: function (e) {
            }
        });
    }
    else {
        $.ajax({
            type: 'DELETE',
            url: 'http://' + window.location.hostname + ':8888/extra/api/schemas/' + $('.deleted_selection_schema').attr('data-id'),
            success: function () {
                $("#delete_message").slideUp();
                if ($('.deleted_selection_schema').hasClass('highlight_taxonomy')) {
                    $('#schema_name').text('-');
                    $('#fields_result').addClass('disabled_schema');
                    $('#fields_result ul').empty();
                    $('#zero_fields').hide();
                    $('#new_field').attr('disabled', true);
                }
                $('.deleted_selection_schema').remove();
            },
            error: function (e) {
            }
        });
    }
});
$("#cancel_delete").click(function () {
    $("#delete_message").slideUp();
    $('.deleted_selection').removeClass('deleted_selection');
    $('.deleted_selection_schema').removeClass('deleted_selection_schema');
});
$('#create_schema').click(function () {
    if ($('#new_schema_name').val() !== "") {
        var viewData = {
            "name": $('#new_schema_name').val(),
            "language": $('#schema_lang').val()
        };
        var data = JSON.stringify(viewData);
        $.ajax({
            type: 'POST',
            url: 'http://' + window.location.hostname + ':8888/extra/api/schemas',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: data,
            success: function (json) {
                $('#schemas_result').prepend('<div class="schema" data-id="' + json.id + '"><img class="delete_icon" src="imgs/delete.png"><p class="title_schema">' + json.name + '-' + json.language + '</p><p class="schema_num">fields: 0</p></div>');
                $('.close-reveal-modal').click();
            },
            error: function (e) {
            }
        });

        $('.close-reveal-modal').click();
    }
    else {
        $('#new_schema_name').addClass('missing');
    }
});
$('#new_field').click(function () {
    $('#new_field_name').removeClass('missing').val("");
    $('#myModal2').reveal();
});
$('#create_field').click(function () {
    if ($('#new_field_name').val() !== "") {
        var viewData = {
            "name": $('#schema_name').text().substr(0, $('#schema_name').text().lastIndexOf('-')),
            "language": $('#schema_name').text().substr($('#schema_name').text().lastIndexOf('-') + 1),
            "fields": []
        };

        $("#fields_result ul li").each(function () {
            viewData.fields.push({
                "name": $(this).find('.field_title').text(),
                "textual": $(this).find('.field').eq(0).find('.type-boolean').text() == 'true',
                "hasSentences": $(this).find('.field').eq(1).find('.type-boolean').text() == 'true',
                "hasParagraphs": $(this).find('.field').eq(2).find('.type-boolean').text() == 'true'
            });
        });
        viewData.fields.push({
            "name": $('#new_field_name').val(),
            "textual": $('#field_textual').val() == 'true',
            "hasSentences": $('#field_sentence').val() == 'true',
            "hasParagraphs": $('#field_paragraphs').val() == 'true'
        });
        var data = JSON.stringify(viewData);
        $.ajax({
            type: 'PUT',
            url: 'http://' + window.location.hostname + ':8888/extra/api/schemas/' + $('.highlight_schema').attr('data-id'),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: data,
            success: function () {
                $('#fields_result ul').prepend('<li><span class="field_title">' + $('#new_field_name').val() + '</span><img class="delete_field" src="imgs/delete.png"><div class="field"><span class="property">textual</span>: <span class="type-boolean">' + $('#field_textual').val() + '</span>,</div><div class="field"><span class="property">hasSentences</span>: <span class="type-boolean">' + $('#field_sentence').val() + '</span>,</div><div class="field"><span class="property">hasParagraphs</span>: <span class="type-boolean">' + $('#field_paragraphs').val() + '</span></div></li>');
                $('.close-reveal-modal').click();
                $('#zero_fields').hide();
                $('.highlight_schema').find('.schema_num').text("fields: " + (parseInt(($('.highlight_schema').find('.schema_num').text().split(' ')[1])) + 1));
            },
            error: function (e) {
            }
        });
    } else {
        $('#new_field_name').addClass('missing');
    }
});
$(document).ready(function () {
    $("form").bind("keypress", function (e) {
        if (e.keyCode == 13) {
            return false;
        }
    });
});
$("#fields_result").on("click", ".delete_field", function (e) {
    $(this).parent('li').addClass('deleted_selection');
    $("#delete_edit").attr('data-ref', 'field');
    $("#delete_message").slideDown();
});