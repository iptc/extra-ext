$(function () {
    $.ajax({
        type: "GET",
        url: "http://" + window.location.hostname + ":8888/extra/api/taxonomies?nPerPage=100",
        dataType: "json",
        success: function (json) {
            for (var i = 0; i < json.entries.length; i++) {
                $('#taxonomies_result').append('<div class="taxonomy" data-id="' + json.entries[i].id + '"><img class="delete_icon" src="imgs/delete.png"><p class="title_taxonomy">' + json.entries[i].name + '-' + json.entries[i].language + '</p><p class="taxonomy_num">topics: ' + json.entries[i].topics + '</p></div>')
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

    $("#taxonomies_result").on("click", ".taxonomy", function () {
        $('#well_topics,#zero_topics').hide();
        $('#topics_result ul').empty();
        $.ajax({
            type: "GET",
            url: "http://" + window.location.hostname + ":8888/extra/api/taxonomies/" + $(this).attr('data-id') + "/topics?nPerPage=20&q=" + $('#topic_search').val(),
            dataType: "json",
            success: function (json) {
                $('#new_topic,#topic_search').removeAttr('disabled');
                for (var i = 0; i < json.entries.length; i++) {
                    $('#topics_result ul').append('<li data-id="' + json.entries[i].topicId + '"><span class="id_topic">' + json.entries[i].topicId + '</span><span class="name_topic">' + json.entries[i].name + '</span><img class="delete_topic" src="imgs/delete.png"><img class="edit_topic" src="imgs/edit.png"><img class="link" src="imgs/link.png"><p class="definition_topic">' + json.entries[i].definition + '</p></li>');
                }
                if (json.entries.length > 0) {
                    $('#topics_result').removeClass('disabled_topic').removeClass('well_opened');
                    var $articles_pagination = $('#topics_pagination');
                    $('#well_topics').show();
                    if ($articles_pagination.data("twbs-pagination")) {
                        $articles_pagination.twbsPagination('destroy');
                    }
                    var total_page = json.total / json.nPerPage;
                    if (total_page % 1 != 0) {
                        total_page = Math.floor(json.total / json.nPerPage) + 1
                    }
                    $articles_pagination.twbsPagination({
                        totalPages: total_page,
                        initiateStartPageClick: false,
                        startPage: 1,
                        onPageClick: function (event, page) {
                            $('#topics_result ul').empty();
                            parse_topics(page);
                        }
                    });
                }
                else {
                    $('#topics_result').removeClass('disabled_topic');
                    $('#zero_topics').show();
                }
            },
            async: true
        });
        $('#taxonomy_name').html($(this).find('.title_taxonomy').text());
        $('.taxonomy').removeClass('highlight_taxonomy');
        $(this).addClass('highlight_taxonomy');
    });
});

function parse_topics(page) {
    $.ajax({
        type: "GET",
        url: "http://" + window.location.hostname + ":8888/extra/api/taxonomies/" + $('.highlight_taxonomy').attr('data-id') + "/topics?nPerPage=20&page=" + page + "&q=" + $('#topic_search').val(),
        dataType: "json",
        success: function (json) {
            for (var i = 0; i < json.entries.length; i++) {
                $('#topics_result ul').append('<li data-id="' + json.entries[i].topicId + '"><span class="id_topic">' + json.entries[i].topicId + '</span><span class="name_topic">' + json.entries[i].name + '</span><img class="delete_topic" src="imgs/delete.png"><img class="edit_topic" src="imgs/edit.png"><img class="link" src="imgs/link.png"><p class="definition_topic">' + json.entries[i].definition + '</p></li>');
            }
        },
        async: true
    });
}
$("#taxonomies_result").on("click", ".delete_icon", function (e) {
    e.stopPropagation();
    $(this).parent('div').addClass('deleted_selection_tax');
    $("#delete_edit").attr('data-ref', 'taxonomy');
    $("#delete_message").slideDown();
});
$("#topics_result").on("click", ".delete_topic", function (e) {
    $(this).parent('li').addClass('deleted_selection');
    $("#delete_edit").attr('data-ref', 'topic');
    $("#delete_message").slideDown();
});
$("#topics_result").on("click", ".link", function (e) {
    window.location.href = '../editor?taxonomy_id=' + $('.highlight_taxonomy').attr('data-id') + "&topic_id=" + $(this).siblings('.name_topic').text() + ' (' + $(this).siblings('.id_topic').text() + ')';
});
$("#topics_result").on("click", ".edit_topic", function (e) {
    e.stopPropagation();
    $('#edit_topic_name,#edit_topic_topicid,#edit_topic_definition').removeClass('missing');
    $('#edit_topic_name').val($(this).siblings('.name_topic').text());
    $('#edit_topic_topicid').val($(this).siblings('.id_topic').text());
    $('#edit_topic_definition').val($(this).siblings('.definition_topic').text());
    $('#edit_topic').attr('data-id', $(this).siblings('.id_topic').text());
    $('#myModal3').reveal();
});
$('#new_taxonomy').click(function () {
    $('#new_taxonomy_name').removeClass('missing').val("");
    $('#myModal').reveal();
});
$('#new_topic').click(function () {
    $('#new_topic_name,#new_topic_topicId,#new_topic_definition').removeClass('missing').val("");
    $('#myModal2').reveal();
});
$('#create_taxonomy').click(function () {
    if ($('#new_taxonomy_name').val() !== "") {
        var viewData = {
            "name": $('#new_taxonomy_name').val(),
            "language": $('#taxonomy_lang').val()
        };
        var data = JSON.stringify(viewData);
        $.ajax({
            type: 'POST',
            url: 'http://' + window.location.hostname + ':8888/extra/api/taxonomies',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: data,
            success: function (json) {
                $('#taxonomies_result').prepend('<div class="taxonomy" data-id="' + json.id + '"><img class="delete_icon" src="imgs/delete.png"><p class="title_taxonomy">' + json.name + '-' + json.language + '</p><p class="taxonomy_num">topics: ' + json.topics + '</p></div>');
                $('.close-reveal-modal').click();
            },
            error: function (e) {
            }
        });

        $('.close-reveal-modal').click();
    }
    else {
        $('#new_taxonomy_name').addClass('missing');
    }
});
$('#create_topic').click(function () {
    var flag = true;
    if ($('#new_topic_name').val() === "") {
        $('#new_topic_name').addClass('missing');
        flag = false;
    }
    if ($('#new_topic_topicId').val() === "") {
        $('#new_topic_topicId').addClass('missing');
        flag = false;
    }
    if ($('#new_topic_definition').val() === "") {
        $('#new_topic_definition').addClass('missing');
        flag = false;
    }
    if (flag) {
        var viewData = {
            "name": $('#new_topic_name').val(),
            "topicId": $('#new_topic_topicId').val(),
            "definition": $('#new_topic_definition').val(),
            "taxonomyId": $('.highlight_taxonomy').attr('data-id')
        };
        var data = JSON.stringify(viewData);
        $.ajax({
            type: 'POST',
            url: 'http://' + window.location.hostname + ':8888/extra/api/taxonomies/' + $('.highlight_taxonomy').attr('data-id') + '/topics',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: data,
            success: function (json) {

                $('#topics_result ul').prepend('<li data-id="' + $('#new_topic_topicId').val() + '"><span class=id_topic>' + $('#new_topic_topicId').val() + '</span><span class="name_topic">' + $('#new_topic_name').val() + '</span><img class="delete_topic" src="imgs/delete.png"><img class="edit_topic" src="imgs/edit.png"><img class="link" src="imgs/link.png"><p class="definition_topic">' + $('#new_topic_definition').val() + '</p></li>');
                $('.close-reveal-modal').click();
                $('#zero_topics').hide();
                $('.highlight_taxonomy').find('.taxonomy_num').text("topics: " + (parseInt(($('.highlight_taxonomy').find('.taxonomy_num').text().split(' ')[1])) + 1));

            },
            error: function (e) {
            }
        });

    }
});
$('#edit_topic').click(function () {
    var flag = true;
    if ($('#edit_topic_name').val() === "") {
        $('#edit_topic_name').addClass('missing');
        flag = false;
    }
    if ($('#edit_topic_topicid').val() === "") {
        $('#edit_topic_topicid').addClass('missing');
        flag = false;
    }
    if ($('#edit_topic_definition').val() === "") {
        $('#edit_topic_definition').addClass('missing');
        flag = false;
    }
    if (flag) {
        var viewData = {
            "name": $('#edit_topic_name').val(),
            "topicId": $('#edit_topic_topicid').val(),
            "definition": $('#edit_topic_definition').val()
        };
        var data = JSON.stringify(viewData);
        $.ajax({
            type: "PUT",
            url: "http://" + window.location.hostname + ":8888/extra/api/taxonomies/" + $('.highlight_taxonomy').attr('data-id') + "/topics/" + $('#edit_topic').attr('data-id'),
            dataType: "json",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: data,
            success: function () {
                $('#topics_result ul li[data-id="' + $('#edit_topic').attr('data-id') + '"]').find('.id_topic').text($('#edit_topic_topicid').val());
                $('#topics_result ul li[data-id="' + $('#edit_topic').attr('data-id') + '"]').find('.name_topic').text($('#edit_topic_name').val());
                $('#topics_result ul li[data-id="' + $('#edit_topic').attr('data-id') + '"]').find('.definition_topic').text($('#edit_topic_definition').val());
                $('#topics_result ul li[data-id="' + $('#edit_topic').attr('data-id') + '"]').attr('data-id', $('#edit_topic_topicid').val());
                $('.close-reveal-modal').click();
            },
            async: true
        });
    }
});
$("#cancel_delete").click(function () {
    $("#delete_message").slideUp();
    $('.deleted_selection').removeClass('deleted_selection');
    $('.deleted_selection_tax').removeClass('deleted_selection_tax');
});
$("#delete_edit").click(function () {
    if ($(this).attr('data-ref') === "topic") {
        $.ajax({
            type: 'DELETE',
            url: 'http://' + window.location.hostname + ':8888/extra/api/taxonomies/' + $('.highlight_taxonomy').attr('data-id') + '/topics/' + $('.deleted_selection').attr('data-id'),
            success: function () {
                $('.highlight_taxonomy').find('.taxonomy_num').text("topics: " + (($('.highlight_taxonomy').find('.taxonomy_num').text().split(' ')[1]) - 1));
                $("#delete_message").slideUp();
                $('.deleted_selection').remove();
                if ($('#topics_result ul li').length === 0) {
                    $('#zero_topics').show();
                    $('#well_topics').hide();
                    $('#topics_result').addClass('well_opened');
                }
            },
            error: function (e) {
            }
        });
    }
    else {
        $.ajax({
            type: 'DELETE',
            url: 'http://' + window.location.hostname + ':8888/extra/api/taxonomies/' + $('.deleted_selection_tax').attr('data-id'),
            success: function () {
                $("#delete_message").slideUp();
                if ($('.deleted_selection_tax').hasClass('highlight_taxonomy')) {
                    $('#taxonomy_name').text('-');
                    $('#topics_result').addClass('disabled_topic').addClass('well_opened');
                    $('#topics_result ul').empty();
                    $('#well_topics,#zero_topics').hide();
                    $('#new_topic,#topic_search').attr('disabled', true);
                }
                $('.deleted_selection_tax').remove();
            },
            error: function (e) {
            }
        });
    }
});
$("#topic_search").keyup(function (e) {
    if (e.keyCode === 13) {
        $('.highlight_taxonomy').click();
    }
});
$(".icon-search").click(function (e) {
    $('.highlight_taxonomy').click();
});