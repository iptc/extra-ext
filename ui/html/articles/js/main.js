var options;
$(function () {
    options = {
        url: "http://" + window.location.hostname + ":5000/api/topics?corpus=apa&association=" + document.querySelector('input[name="radio"]:checked').value,
        getValue: "search",
        minCharNumber: 2,
        list: {
            match: {
                enabled: true
            },
            onChooseEvent: function (e) {
                /*
                 }*/
            },
            onHideListEvent: function (e) {
            },
            showAnimation: {
                type: "fade",
                time: 400,
                callback: function () {
                }
            },
            hideAnimation: {
                type: "slide",
                time: 400,
                callback: function () {
                }
            }
        }
    };

    $("#topics_autocomplete").easyAutocomplete(options);
    $.ajax({
        type: "GET",
        url: "http://" + window.location.hostname + ":5000/api/stats?corpus=apa&field=contentCreated",
        dataType: "json",
        success: function (json) {
            $("#date_range").daterangepicker({
                initialText: 'Select period...',
                datepickerOptions: {
                    numberOfMonths: 2,
                    minDate: moment(json.min).format("MM/DD/YYYY"),
                    maxDate: moment(json.max).format("MM/DD/YYYY")
                },
                change: function (event, data) {
                    var json_date = JSON.parse($("#date_range").val());
                    if (json_date.start === json_date.end) {
                        $("#date_range").daterangepicker("clearRange");
                    }
                }
            });
        },
        async: true
    });
    var width = 212,
        height = 44 * 4,
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
});

$("#settings").on("click", ".sub1", function (e) {
    e.preventDefault();
    if (!($(this).find('a').hasClass('activelan'))) {
        $('.well,#empty,#info').hide();
        $('#tiles').empty();
        $('#slugline_param').text('');
        $("#date_range").daterangepicker("clearRange");
        $('.sub1 a').removeClass('activelan');
        $(this).find('a').addClass('activelan');
        $("#date_range").daterangepicker("destroy");
        if ($(this).attr('id') === "apa") {
            options.url = "http://" + window.location.hostname + ":5000/api/topics?corpus=apa&association=" + document.querySelector('input[name="radio"]:checked').value;
            $.ajax({
                type: "GET",
                url: "http://" + window.location.hostname + ":5000/api/stats?corpus=apa&field=contentCreated",
                dataType: "json",
                success: function (json) {
                    $("#date_range").daterangepicker({
                        initialText: 'Select period...',
                        datepickerOptions: {
                            numberOfMonths: 2,
                            minDate: moment(json.min).format("MM/DD/YYYY"),
                            maxDate: moment(json.max).format("MM/DD/YYYY")
                        },
                        change: function (event, data) {
                            var json_date = JSON.parse($("#date_range").val());
                            if (json_date.start === json_date.end) {
                                $("#date_range").daterangepicker("clearRange");
                            }
                        }
                    });
                },
                async: true
            });
        }
        else if ($(this).attr('id') === "reuters") {
            options.url = "http://" + window.location.hostname + ":5000/api/topics?corpus=reuters&association=" + document.querySelector('input[name="radio"]:checked').value;
            $.ajax({
                type: "GET",
                url: "http://" + window.location.hostname + ":5000/api/stats?corpus=reuters&field=contentCreated",
                dataType: "json",
                success: function (json) {
                    $("#date_range").daterangepicker({
                        initialText: 'Select period...',
                        datepickerOptions: {
                            numberOfMonths: 2,
                            minDate: moment(json.min).format("MM/DD/YYYY"),
                            maxDate: moment(json.max).format("MM/DD/YYYY")
                        },
                        change: function (event, data) {
                            var json_date = JSON.parse($("#date_range").val());
                            if (json_date.start === json_date.end) {
                                $("#date_range").daterangepicker("clearRange");
                            }
                        }
                    });
                },
                async: true
            });
        }
        $("#topics_autocomplete").val("").easyAutocomplete(options);
    }
});
$('#search_start').click(function () {
    abort();
    $('#loading').show();
    $('.well,#empty,#info').hide();
    $('#tiles').empty();
    var section = $('#slug_value').text();
    var q = $('#query').val();
    var corpus = $('.activelan').parent().attr('id');
    var mediatopic = $('#topics_autocomplete').val().match(/(?:\()[^\(\)]*?(?:\))/g);
    if (mediatopic != null) {
        mediatopic = mediatopic[mediatopic.length - 1].slice(1, -1);
        mediatopic = "medtop:" + mediatopic;
    }
    else {
        mediatopic = "";
    }
    var association = document.querySelector('input[name="radio"]:checked').value;
    var json_date = $("#date_range").val();
    var start, end;
    if (json_date === "") {
        start = 0, end = 0;
    }
    else {
        json_date = JSON.parse($("#date_range").val());
        start = (new Date(json_date.start).getTime()) / 1000;
        end = (new Date(json_date.end).getTime()) / 1000;
    }
    $.ajax({
        type: "GET",
        url: "http://" + window.location.hostname + ":5000/api/articles?nPerPage=10&page=1&q=" + q + "&corpus=" + corpus + "&mediatopic=" + mediatopic + "&association=" + association + "&since=" + start + "&until=" + end + "&section=" + section,
        dataType: "json",
        success: function (json) {
            var tags_anc = '', tags_dir = '', tags_user = '';
            var date = '', slugline = '', style_exclude = '';
            for (var i = 0; i < json.articles.length; i++) {
                tags_anc = '', tags_dir = '', slugline = '', tags_user = '';
                for (var k = 0; k < json.articles[i].mediatopics.length; k++) {
                    if (json.articles[i].mediatopics[k].association === "why:ancestor") {
                        if (json.articles[i].mediatopics[k].exclude === "true") {
                            tags_anc = tags_anc + '<li><a style="background-color: #de796d" href="' + json.articles[i].mediatopics[k].url + '" target="_blank">' + json.articles[i].mediatopics[k].name + ' (' + json.articles[i].mediatopics[k].id.replace('medtop:', '') + ')</a><img data-parent_id="' + json.articles[i].id + '" data-association="' + json.articles[i].mediatopics[k].association + '" data-topic_id="' + json.articles[i].mediatopics[k].id + '" class="undo_tag" src="imgs/undo.png"></li>'
                        }
                        else {
                            tags_anc = tags_anc + '<li><a href="' + json.articles[i].mediatopics[k].url + '" target="_blank">' + json.articles[i].mediatopics[k].name + ' (' + json.articles[i].mediatopics[k].id.replace('medtop:', '') + ')</a><img data-parent_id="' + json.articles[i].id + '" data-association="' + json.articles[i].mediatopics[k].association + '" data-topic_id="' + json.articles[i].mediatopics[k].id + '" class="delete_tag" src="imgs/delete.png"></li>'
                        }
                    }
                    else if (json.articles[i].mediatopics[k].association === "why:direct") {
                        if (json.articles[i].mediatopics[k].exclude === "true") {
                            tags_dir = tags_dir + '<li><a style="background-color: #de796d" href="' + json.articles[i].mediatopics[k].url + '" target="_blank">' + json.articles[i].mediatopics[k].name + ' (' + json.articles[i].mediatopics[k].id.replace('medtop:', '') + ')</a><img data-parent_id="' + json.articles[i].id + '" data-association="' + json.articles[i].mediatopics[k].association + '" data-topic_id="' + json.articles[i].mediatopics[k].id + '" class="undo_tag" src="imgs/undo.png"></li>'
                        }
                        else {
                            tags_dir = tags_dir + '<li><a href="' + json.articles[i].mediatopics[k].url + '" target="_blank">' + json.articles[i].mediatopics[k].name + ' (' + json.articles[i].mediatopics[k].id.replace('medtop:', '') + ')</a><img data-parent_id="' + json.articles[i].id + '" data-association="' + json.articles[i].mediatopics[k].association + '" data-topic_id="' + json.articles[i].mediatopics[k].id + '" class="delete_tag" src="imgs/delete.png"></li>'
                        }
                    }
                    else {
                        if (json.articles[i].mediatopics[k].exclude === "true") {
                            tags_user = tags_user + '<li><a style="background-color: #de796d" href="' + json.articles[i].mediatopics[k].url + '" target="_blank">' + json.articles[i].mediatopics[k].name + ' (' + json.articles[i].mediatopics[k].id.replace('medtop:', '') + ')</a><img data-parent_id="' + json.articles[i].id + '" data-association="' + json.articles[i].mediatopics[k].association + '" data-topic_id="' + json.articles[i].mediatopics[k].id + '" class="undo_tag" src="imgs/undo.png"></li>'
                        }
                        else {
                            tags_user = tags_user + '<li><a href="' + json.articles[i].mediatopics[k].url + '" target="_blank">' + json.articles[i].mediatopics[k].name + ' (' + json.articles[i].mediatopics[k].id.replace('medtop:', '') + ')</a><img data-parent_id="' + json.articles[i].id + '" data-association="' + json.articles[i].mediatopics[k].association + '" data-topic_id="' + json.articles[i].mediatopics[k].id + '" class="delete_tag" src="imgs/delete.png"></li>'
                        }
                    }
                }
                date = json.articles[i].contentCreated.split('T')[0] + ' ' + json.articles[i].contentCreated.split('T')[1].substr(0, 5);

                for (var l = 0; l < json.articles[i].slugline.split(json.delimiter).length; l++) {
                    slugline = slugline + '<li><a href="javascript:void(0)">' + json.articles[i].slugline.split(json.delimiter)[l] + '</a></li>'
                }
                if (json.articles[i].exclude === "true") {
                    style_exclude = "border:2px solid #d0402f";
                }
                else {
                    style_exclude = "";
                }
                if (tags_user !== "") {
                    $('#tiles').append('<li style="' + style_exclude + '" data-id="' + json.articles[i].id + '"><div class="hidden_body">' + json.articles[i].body + '</div><ul class="breadcrumb">' + slugline + '</ul><p class="date">' + date + '</p><h3 class="title">' + json.articles[i].title + '</h3><p>' + json.articles[i].description + '</p><p class="topic_add">Add a topic</p><button class="topic_include btn btn-primary">Include</button><input class="topics_autocomplete" id="topics_autocomplete_' + i + '" placeholder="Type a topic..."/><div class="topics"><div class="media_topics"><p class="topics_title">Direct Media Topics</p><ul class="media_topic">' + tags_dir + '</ul></div><div class="media_topics user_defined_topics"><p class="topics_title">User Defined Media Topics</p><ul class="media_topic">' + tags_user + '</ul></div><div class="media_topics hidden_topics"><p class="topics_title">Ancestor Media Topics</p><ul class="media_topic">' + tags_anc + '</ul></div></div></li>');
                }
                else {
                    $('#tiles').append('<li style="' + style_exclude + '" data-id="' + json.articles[i].id + '"><div class="hidden_body">' + json.articles[i].body + '</div><ul class="breadcrumb">' + slugline + '</ul><p class="date">' + date + '</p><h3 class="title">' + json.articles[i].title + '</h3><p>' + json.articles[i].description + '</p><p class="topic_add">Add a topic</p><button class="topic_include btn btn-primary">Include</button><input class="topics_autocomplete" id="topics_autocomplete_' + i + '" placeholder="Type a topic..."/><div class="topics"><div class="media_topics"><p class="topics_title">Direct Media Topics</p><ul class="media_topic">' + tags_dir + '</ul></div><div class="media_topics hidden_topics"><p class="topics_title">Ancestor Media Topics</p><ul class="media_topic">' + tags_anc + '</ul></div></div></li>');
                }
            }
            $('#loading').hide();
            $('.well,#info').show();
            var info_text = json.found + ' Articles';

            if ($('#query').val() !== "") {
                info_text = info_text + ' for Query "' + $('#query').val() + '"';
            }
            info_text = info_text + ' on corpus ' + $('.activelan').parent().attr('id').toUpperCase();

            var mediatopic = $('#topics_autocomplete').val().match(/(?:\()[^\(\)]*?(?:\))/g);
            if (mediatopic != null) {
                var mediatopicname = $('#topics_autocomplete').val().replace(mediatopic, '').slice(0, -1);
                info_text = info_text + " associated with " + mediatopicname + " media topic";
            }

            if (json_date !== "") {
                info_text = info_text + " between " + moment(json_date.start).format('YYYY-MM-DD') + " and " + moment(json_date.end).format('YYYY-MM-DD');
            }
            $('#info').text(info_text);

            if (json.found > 0) {
                var $pagination_list = $('#pagination_list');
                if ($pagination_list.data("twbs-pagination")) {
                    $pagination_list.twbsPagination('destroy');
                }
                $pagination_list.twbsPagination({
                    totalPages: Math.ceil(json.found / 10),
                    initiateStartPageClick: false,
                    startPage: 1,
                    onPageClick: function (event, page) {
                        abort();
                        $('#loading').show();
                        $('#tiles').empty();
                        parse_articles(page);
                    }
                });
            }
            else {
                $('.well').hide();
                $('#empty').show();
            }
        },
        async: true
    });
});

function parse_articles(page_num) {
    var section = $('#slug_value').text();
    var q = $('#query').val();
    var corpus = $('.activelan').parent().attr('id');
    var mediatopic = $('#topics_autocomplete').val().match(/(?:\()[^\(\)]*?(?:\))/g);
    if (mediatopic != null) {
        mediatopic = mediatopic[mediatopic.length - 1].slice(1, -1);
        mediatopic = "medtop:" + mediatopic;
    }
    else {
        mediatopic = "";
    }
    var association = document.querySelector('input[name="radio"]:checked').value;
    var json_date = $("#date_range").val();
    var start, end;
    if (json_date === "") {
        start = 0, end = 0;
    }
    else {
        json_date = JSON.parse($("#date_range").val());
        start = (new Date(json_date.start).getTime()) / 1000;
        end = (new Date(json_date.end).getTime()) / 1000;
    }
    $.ajax({
        type: "GET",
        url: "http://" + window.location.hostname + ":5000/api/articles?nPerPage=10&page=" + page_num + "&q=" + q + "&corpus=" + corpus + "&mediatopic=" + mediatopic + "&association=" + association + "&since=" + start + "&until=" + end + "&section=" + section,
        dataType: "json",
        success: function (json) {
            var tags_anc = '', tags_dir = '', tags_user = '';
            var date = '', slugline = '', style_exclude = '';
            for (var i = 0; i < json.articles.length; i++) {
                tags_anc = '', tags_dir = '', slugline = '', tags_user = '';
                for (var k = 0; k < json.articles[i].mediatopics.length; k++) {
                    if (json.articles[i].mediatopics[k].association === "why:ancestor") {
                        if (json.articles[i].mediatopics[k].exclude === "true") {
                            tags_anc = tags_anc + '<li><a style="background-color: #de796d" href="' + json.articles[i].mediatopics[k].url + '" target="_blank">' + json.articles[i].mediatopics[k].name + ' (' + json.articles[i].mediatopics[k].id.replace('medtop:', '') + ')</a><img data-parent_id="' + json.articles[i].id + '" data-association="' + json.articles[i].mediatopics[k].association + '" data-topic_id="' + json.articles[i].mediatopics[k].id + '" class="undo_tag" src="imgs/undo.png"></li>'
                        }
                        else {
                            tags_anc = tags_anc + '<li><a href="' + json.articles[i].mediatopics[k].url + '" target="_blank">' + json.articles[i].mediatopics[k].name + ' (' + json.articles[i].mediatopics[k].id.replace('medtop:', '') + ')</a><img data-parent_id="' + json.articles[i].id + '" data-association="' + json.articles[i].mediatopics[k].association + '" data-topic_id="' + json.articles[i].mediatopics[k].id + '" class="delete_tag" src="imgs/delete.png"></li>'
                        }
                    }
                    else if (json.articles[i].mediatopics[k].association === "why:direct") {
                        if (json.articles[i].mediatopics[k].exclude === "true") {
                            tags_dir = tags_dir + '<li><a style="background-color: #de796d" href="' + json.articles[i].mediatopics[k].url + '" target="_blank">' + json.articles[i].mediatopics[k].name + ' (' + json.articles[i].mediatopics[k].id.replace('medtop:', '') + ')</a><img data-parent_id="' + json.articles[i].id + '" data-association="' + json.articles[i].mediatopics[k].association + '" data-topic_id="' + json.articles[i].mediatopics[k].id + '" class="undo_tag" src="imgs/undo.png"></li>'
                        }
                        else {
                            tags_dir = tags_dir + '<li><a href="' + json.articles[i].mediatopics[k].url + '" target="_blank">' + json.articles[i].mediatopics[k].name + ' (' + json.articles[i].mediatopics[k].id.replace('medtop:', '') + ')</a><img data-parent_id="' + json.articles[i].id + '" data-association="' + json.articles[i].mediatopics[k].association + '" data-topic_id="' + json.articles[i].mediatopics[k].id + '" class="delete_tag" src="imgs/delete.png"></li>'
                        }
                    }
                    else {
                        if (json.articles[i].mediatopics[k].exclude === "true") {
                            tags_user = tags_user + '<li><a style="background-color: #de796d" href="' + json.articles[i].mediatopics[k].url + '" target="_blank">' + json.articles[i].mediatopics[k].name + ' (' + json.articles[i].mediatopics[k].id.replace('medtop:', '') + ')</a><img data-parent_id="' + json.articles[i].id + '" data-association="' + json.articles[i].mediatopics[k].association + '" data-topic_id="' + json.articles[i].mediatopics[k].id + '" class="undo_tag" src="imgs/undo.png"></li>'
                        }
                        else {
                            tags_user = tags_user + '<li><a href="' + json.articles[i].mediatopics[k].url + '" target="_blank">' + json.articles[i].mediatopics[k].name + ' (' + json.articles[i].mediatopics[k].id.replace('medtop:', '') + ')</a><img data-parent_id="' + json.articles[i].id + '" data-association="' + json.articles[i].mediatopics[k].association + '" data-topic_id="' + json.articles[i].mediatopics[k].id + '" class="delete_tag" src="imgs/delete.png"></li>'
                        }
                    }
                }
                date = json.articles[i].contentCreated.split('T')[0] + ' ' + json.articles[i].contentCreated.split('T')[1].substr(0, 5);
                for (var l = 0; l < json.articles[i].slugline.split(json.delimiter).length; l++) {
                    slugline = slugline + '<li><a href="#">' + json.articles[i].slugline.split(json.delimiter)[l] + '</a></li>'
                }
                if (json.articles[i].exclude === "true") {
                    style_exclude = "border:2px solid #d0402f";
                }
                else {
                    style_exclude = "";
                }
                if (tags_user !== "") {
                    $('#tiles').append('<li style="' + style_exclude + '" data-id="' + json.articles[i].id + '"><div class="hidden_body">' + json.articles[i].body + '</div><ul class="breadcrumb">' + slugline + '</ul><p class="date">' + date + '</p><h3 class="title">' + json.articles[i].title + '</h3><p>' + json.articles[i].description + '</p><p class="topic_add">Add a topic</p><button class="topic_include btn btn-primary">Include</button><input class="topics_autocomplete" id="topics_autocomplete_' + i + '" placeholder="Type a topic..."/><div class="topics"><div class="media_topics"><p class="topics_title">Direct Media Topics</p><ul class="media_topic">' + tags_dir + '</ul></div><div class="media_topics user_defined_topics"><p class="topics_title">User Defined Media Topics</p><ul class="media_topic">' + tags_user + '</ul></div><div class="media_topics hidden_topics"><p class="topics_title">Ancestor Media Topics</p><ul class="media_topic">' + tags_anc + '</ul></div></div></li>');
                }
                else {
                    $('#tiles').append('<li style="' + style_exclude + '" data-id="' + json.articles[i].id + '"><div class="hidden_body">' + json.articles[i].body + '</div><ul class="breadcrumb">' + slugline + '</ul><p class="date">' + date + '</p><h3 class="title">' + json.articles[i].title + '</h3><p>' + json.articles[i].description + '</p><p class="topic_add">Add a topic</p><button class="topic_include btn btn-primary">Include</button><input class="topics_autocomplete" id="topics_autocomplete_' + i + '" placeholder="Type a topic..."/><div class="topics"><div class="media_topics"><p class="topics_title">Direct Media Topics</p><ul class="media_topic">' + tags_dir + '</ul></div><div class="media_topics hidden_topics"><p class="topics_title">Ancestor Media Topics</p><ul class="media_topic">' + tags_anc + '</ul></div></div></li>');
                }
            }
            $('#loading').hide();
        },
        async: true
    });
}

$(document).on("click", "#tiles > li", function () {
    var corpus = $('.activelan').parent().attr('id');
    if ($('.btn-primary').attr('id') == "xml_but") {
        if ($(this).find('.user_defined_topics').length > 0) {
            $('#myModal').html('<div style="text-align: center"><div class="btn-group"><button type="button" id="html_but" class="btn btn-default">HTML</button><button type="button" id="xml_but" data-id="' + $(this).attr('data-id') + '" class="btn btn-primary">XML</button></div></div><div id="html_content" style="display: none"><ul class="breadcrumb">' + $(this).find('.breadcrumb').html() + '</ul><p class="date">' + $(this).find('.date').html() + '</p>' + $(this).find('.hidden_body').html() + $(this).find('.topics').html().replace('user_defined_topics', 'border').replace('hidden_topics', 'border').replace(/media_topics/g, 'media_topics_popup_3') + '</div><div id="xml_content"></div><a class="close-reveal-modal">&#215;</a>');
        }
        else {
            $('#myModal').html('<div style="text-align: center"><div class="btn-group"><button type="button" id="html_but" class="btn btn-default">HTML</button><button type="button" id="xml_but" data-id="' + $(this).attr('data-id') + '" class="btn btn-primary">XML</button></div></div><div id="html_content" style="display: none"><ul class="breadcrumb">' + $(this).find('.breadcrumb').html() + '</ul><p class="date">' + $(this).find('.date').html() + '</p>' + $(this).find('.hidden_body').html() + $(this).find('.topics').html().replace('hidden_topics', 'border').replace(/media_topics/g, 'media_topics_popup_3') + '</div><div id="xml_content"></div><a class="close-reveal-modal">&#215;</a>');
        }
        $.ajax({
            type: "GET",
            url: "http://" + window.location.hostname + ":5000/api/article/xml?corpus=" + corpus + "&articleId=" + $(this).attr('data-id'),
            dataType: "json",
            success: function (json) {
                LoadXMLString('xml_content', json.xml);
            },
            async: true
        });
    }
    else {
        if ($(this).find('.user_defined_topics').length > 0) {
            $('#myModal').html('<div style="text-align: center"><div class="btn-group"><button type="button" id="html_but" class="btn btn-primary">HTML</button><button type="button" id="xml_but" data-id="' + $(this).attr('data-id') + '" class="btn btn-default">XML</button></div></div><div id="html_content"><ul class="breadcrumb">' + $(this).find('.breadcrumb').html() + '</ul><p class="date">' + $(this).find('.date').html() + '</p>' + $(this).find('.hidden_body').html() + $(this).find('.topics').html().replace('user_defined_topics', 'border').replace('hidden_topics', 'border').replace('user_defined_topics', 'border').replace(/media_topics/g, 'media_topics_popup_3') + '</div><div id="xml_content" style="display: none"></div><a class="close-reveal-modal">&#215;</a>');
        }
        else {
            $('#myModal').html('<div style="text-align: center"><div class="btn-group"><button type="button" id="html_but" class="btn btn-primary">HTML</button><button type="button" id="xml_but" data-id="' + $(this).attr('data-id') + '" class="btn btn-default">XML</button></div></div><div id="html_content"><ul class="breadcrumb">' + $(this).find('.breadcrumb').html() + '</ul><p class="date">' + $(this).find('.date').html() + '</p>' + $(this).find('.hidden_body').html() + $(this).find('.topics').html().replace('hidden_topics', 'border').replace(/media_topics/g, 'media_topics_popup_3') + '</div><div id="xml_content" style="display: none"></div><a class="close-reveal-modal">&#215;</a>');
        }
    }
    $('#myModal').reveal();
});
$("#myModal").on("click", ".btn-default", function (e) {
    var corpus = $('.activelan').parent().attr('id');
    if ($(this).attr('id') === "xml_but") {
        $('#xml_content').show();
        $('#html_content').hide();
        $.ajax({
            type: "GET",
            url: "http://" + window.location.hostname + ":5000/api/article/xml?corpus=" + corpus + "&articleId=" + $(this).attr('data-id'),
            dataType: "json",
            success: function (json) {
                LoadXMLString('xml_content', json.xml);
            },
            async: true
        });
    }
    else {
        $('#xml_content').hide();
        $('#html_content').show();
    }
    $('.btn-group').find('button').removeClass('btn-primary').addClass('btn-default');
    $(this).addClass('btn-primary').removeClass('btn-default');
});

$("#query").keyup(function (e) {
    if (e.keyCode === 13) {
        $('#search_start').click();
    }
});

$('.slugline').click(function () {
    $('#myModal_slugline').reveal();
    $('#loading_slugline').show();
    $('.well_slugline,#empty_slugline,#info_slugline,#breadcrumb_wrapper').hide();
    $('#tiles_slugline,#breadcrumb').empty();
    parse_sections_root();
});
function parse_sections_root() {
    var corpus = $('.activelan').parent().attr('id');
    $.ajax({
        type: "GET",
        url: "http://" + window.location.hostname + ":5000/api/section/root/children?nPerPage=20&page=1&corpus=" + corpus,
        dataType: "json",
        success: function (json) {
            $('#done_section').attr('data-delimeter', json.delimiter);
            $('#loading_slugline').hide();
            $('.well_slugline,#info_slugline').show();
            $('#info_slugline').text(json.found + ' sluglines on corpus ' + corpus.toUpperCase());
            for (var i = 0; i < json.sections.length; i++) {
                $('#tiles_slugline').append('<li data-id=' + json.sections[i].id + '><a href="javascript:void(0)">' + json.sections[i].label + '</a></li>');
            }
            if (json.found > 0) {
                var $pagination_list = $('#pagination_list_slugline');
                if ($pagination_list.data("twbs-pagination")) {
                    $pagination_list.twbsPagination('destroy');
                }
                $pagination_list.twbsPagination({
                    totalPages: Math.ceil(json.found / 20),
                    initiateStartPageClick: false,
                    startPage: 1,
                    onPageClick: function (event, page) {
                        parse_sections_root_page(page)
                    }
                });
            }
            else {
                $('.well_slugline').hide();
                $('#empty_slugline').show();
            }
        },
        async: true
    });
}
function parse_sections_root_page(page) {
    $('#loading_slugline').show();
    $('#tiles_slugline').empty();
    var corpus = $('.activelan').parent().attr('id');
    $.ajax({
        type: "GET",
        url: "http://" + window.location.hostname + ":5000/api/section/root/children?nPerPage=20&page=" + page + "&corpus=" + corpus,
        dataType: "json",
        success: function (json) {
            $('#loading_slugline').hide();
            for (var i = 0; i < json.sections.length; i++) {
                $('#tiles_slugline').append('<li data-id=' + json.sections[i].id + '><a href="javascript:void(0)">' + json.sections[i].label + '</a></li>');
            }
        },
        async: true
    });
}
$("#tiles_slugline").on("click", "li", function () {
    $('#breadcrumb_wrapper').show();
    $('#tiles_slugline').empty();
    $('#loading_slugline').show();
    $('#breadcrumb').append(' <li data-id=' + $(this).attr('data-id') + '><a href="javascript:void(0)">' + $(this).text() + '</a></li>');
    parse_section_level($(this).attr('data-id'));
});
function parse_section_level(id) {
    var corpus = $('.activelan').parent().attr('id');
    $.ajax({
        type: "GET",
        url: "http://" + window.location.hostname + ":5000/api/section/" + id + "/children?nPerPage=20&page=1&corpus=" + corpus,
        dataType: "json",
        success: function (json) {
            $('#loading_slugline').hide();
            var slugline_current = '';
            var listItems = $("#breadcrumb li");
            listItems.each(function (idx, li) {
                slugline_current = slugline_current + $(li).find('a').text() + '/';
            });
            $('#info_slugline').text(json.found + ' sluglines on corpus ' + corpus.toUpperCase() + ' for ' + slugline_current.slice(0, -1));
            for (var i = 0; i < json.sections.length; i++) {
                $('#tiles_slugline').append('<li data-id=' + json.sections[i].id + '><a href="javascript:void(0)">' + json.sections[i].label + '</a></li>');
            }
            if (json.found > 0) {
                var $pagination_list = $('#pagination_list_slugline');
                if ($pagination_list.data("twbs-pagination")) {
                    $pagination_list.twbsPagination('destroy');
                }
                $pagination_list.twbsPagination({
                    totalPages: Math.ceil(json.found / 20),
                    initiateStartPageClick: false,
                    startPage: 1,
                    onPageClick: function (event, page) {
                        parse_section_level_page(page, id);
                    }
                });
            }
            else {
                $('.well_slugline').hide();
                $('#empty_slugline').show();
            }
        },
        async: true
    });
}
function parse_section_level_page(page, id) {
    $('#loading_slugline').show();
    $('#tiles_slugline').empty();
    var corpus = $('.activelan').parent().attr('id');
    $.ajax({
        type: "GET",
        url: "http://" + window.location.hostname + ":5000/api/section/" + id + "/children?nPerPage=20&page=" + page + "&corpus=" + corpus,
        dataType: "json",
        success: function (json) {
            $('#loading_slugline').hide();
            for (var i = 0; i < json.sections.length; i++) {
                $('#tiles_slugline').append('<li data-id=' + json.sections[i].id + '><a href="javascript:void(0)">' + json.sections[i].label + '</a></li>');
            }
        },
        async: true
    });
}
$('#clear_section').click(function () {
    $('#loading_slugline').show();
    $('.well_slugline,#empty_slugline,#info_slugline,#breadcrumb_wrapper').hide();
    $('#tiles_slugline,#breadcrumb').empty();
    parse_sections_root();
});
$('#done_section').click(function () {
    $('#myModal_slugline').find('.close-reveal-modal').click();
    var $this = $(this);
    var slugline_current = '';
    var listItems = $("#breadcrumb li");
    listItems.each(function (idx, li) {
        slugline_current = slugline_current + $(li).find('a').text() + $this.attr('data-delimeter');
    });
    $('#slugline_param').html('<span id="slug_value">' + slugline_current.slice(0, -1) + '</span><span id="erase_slugline">&#215;</span>');
});
$('#clear_last').click(function () {
    $('#empty_slugline').hide();
    $('#breadcrumb li:last').remove();
    if ($('#breadcrumb li').length === 0) {
        $('#loading_slugline').show();
        $('.well_slugline,#empty_slugline,#info_slugline,#breadcrumb_wrapper').hide();
        $('#tiles_slugline').empty();
        parse_sections_root();
    }
    else {
        $('#tiles_slugline').empty();
        $('#loading_slugline').show();
        parse_section_level($('#breadcrumb li:last').attr('data-id'));
    }
});
$("#slugline_param").on("click", "#erase_slugline", function () {
    $('#slugline_param').text('');
});
$("#tiles").on("click", ".delete_tag", function (e) {
    e.stopPropagation();
    var id = $(this).attr('data-parent_id');
    var corpus = $('.activelan').parent().attr('id');
    var association = $(this).attr('data-association');
    var mediatopic = $(this).attr('data-topic_id');
    var $this = $(this);
    var mediatopic_user = $('#topics_autocomplete').val().match(/(?:\()[^\(\)]*?(?:\))/g);
    if (mediatopic_user != null) {
        mediatopic_user = mediatopic_user[mediatopic_user.length - 1].slice(1, -1);
        mediatopic_user = "medtop:" + mediatopic_user;
    }
    else {
        mediatopic_user = "";
    }
    $.ajax({
        type: "PUT",
        url: "http://" + window.location.hostname + ":5000/api/articles/" + id + "?corpus=" + corpus + "&exclude=true&association=" + association + "&mediatopic=" + mediatopic,
        dataType: "json",
        success: function () {
            $this.siblings('a').css('background-color', '#de796d');
            $this.removeClass('delete_tag').addClass('undo_tag').attr('src', 'imgs/undo.png');
            console.log(mediatopic + '----' + mediatopic_user);
            if (mediatopic === mediatopic_user) {
                $('li[data-id="' + id + '"]').css('border', '2px solid #d0402f');
            }
        },
        async: true
    });
});

$("#tiles").on("click", ".undo_tag", function (e) {
    e.stopPropagation();
    var id = $(this).attr('data-parent_id');
    var corpus = $('.activelan').parent().attr('id');
    var association = $(this).attr('data-association');
    var mediatopic = $(this).attr('data-topic_id');
    var $this = $(this);
    var mediatopic_user = $('#topics_autocomplete').val().match(/(?:\()[^\(\)]*?(?:\))/g);
    if (mediatopic_user != null) {
        mediatopic_user = mediatopic_user[mediatopic_user.length - 1].slice(1, -1);
        mediatopic_user = "medtop:" + mediatopic_user;
    }
    else {
        mediatopic_user = "";
    }

    $.ajax({
        type: "PUT",
        url: "http://" + window.location.hostname + ":5000/api/articles/" + id + "?corpus=" + corpus + "&exclude=false&association=" + association + "&mediatopic=" + mediatopic,
        dataType: "json",
        success: function () {
            $this.siblings('a').css('background-color', '#ddd');
            $this.addClass('delete_tag').removeClass('undo_tag').attr('src', 'imgs/delete.png');
            if (mediatopic === mediatopic_user) {
                $('li[data-id="' + id + '"]').css('border', '4px solid #FAFAFA');
            }
        },
        async: true
    });
});
$("#myModal").on("click", ".undo_tag", function (e) {
    e.stopPropagation();
    var id = $(this).attr('data-parent_id');
    var corpus = $('.activelan').parent().attr('id');
    var association = $(this).attr('data-association');
    var mediatopic = $(this).attr('data-topic_id');
    var $this = $(this);
    var mediatopic_user = $('#topics_autocomplete').val().match(/(?:\()[^\(\)]*?(?:\))/g);
    if (mediatopic_user != null) {
        mediatopic_user = mediatopic_user[mediatopic_user.length - 1].slice(1, -1);
        mediatopic_user = "medtop:" + mediatopic_user;
    }
    else {
        mediatopic_user = "";
    }

    $.ajax({
        type: "PUT",
        url: "http://" + window.location.hostname + ":5000/api/articles/" + id + "?corpus=" + corpus + "&exclude=false&association=" + association + "&mediatopic=" + mediatopic,
        dataType: "json",
        success: function () {
            $this.siblings('a').css('background-color', '#ddd');
            $this.addClass('delete_tag').removeClass('undo_tag').attr('src', 'imgs/delete.png');
            if (mediatopic === mediatopic_user) {
                $('li[data-id="' + id + '"]').css('border', '4px solid #FAFAFA');
            }
        },
        async: true
    });
});
$("#myModal").on("click", ".delete_tag", function (e) {
    e.stopPropagation();
    var id = $(this).attr('data-parent_id');
    var corpus = $('.activelan').parent().attr('id');
    var association = $(this).attr('data-association');
    var mediatopic = $(this).attr('data-topic_id');
    var $this = $(this);
    var mediatopic_user = $('#topics_autocomplete').val().match(/(?:\()[^\(\)]*?(?:\))/g);
    if (mediatopic_user != null) {
        mediatopic_user = mediatopic_user[mediatopic_user.length - 1].slice(1, -1);
        mediatopic_user = "medtop:" + mediatopic_user;
    }
    else {
        mediatopic_user = "";
    }

    $.ajax({
        type: "PUT",
        url: "http://" + window.location.hostname + ":5000/api/articles/" + id + "?corpus=" + corpus + "&exclude=true&association=" + association + "&mediatopic=" + mediatopic,
        dataType: "json",
        success: function () {
            $this.siblings('a').css('background-color', '#de796d');
            $this.removeClass('delete_tag').addClass('undo_tag').attr('src', 'imgs/undo.png');
            if (mediatopic === mediatopic_user) {
                $('li[data-id="' + id + '"]').css('border', '2px solid #d0402f');
            }
        },
        async: true
    });
});
$("#tiles").on("click", ".topic_add", function (e) {
    e.stopPropagation();
    var options_article = {
        url: "http://" + window.location.hostname + ":5000/api/topics?corpus=apa&association=why:direct",
        getValue: "search",
        minCharNumber: 2,
        list: {
            match: {
                enabled: true
            },
            onChooseEvent: function (e) {
            },
            onHideListEvent: function (e) {
            },
            showAnimation: {
                type: "fade",
                time: 400,
                callback: function () {
                }
            },
            hideAnimation: {
                type: "slide",
                time: 400,
                callback: function () {
                }
            }
        }
    };

    $("#topics_autocomplete_" + $(this).parent('li').index()).slideDown().easyAutocomplete(options_article);
    $(this).siblings('.topics').addClass('open_autocomplete');
    $(this).siblings('.topic_include').slideDown();
    $(this).remove();


});
$('.radio input').click(function () {
    var corpus = $('.activelan').parent().attr('id');
    if ($(this).val() === "why:ancestor") {
        options.url = "http://" + window.location.hostname + ":5000/api/topics?corpus=" + corpus + "&association=why:ancestor";
    }
    else {
        options.url = "http://" + window.location.hostname + ":5000/api/topics?corpus=" + corpus + "&association=why:direct";
    }
    $("#topics_autocomplete").val("").easyAutocomplete(options);
});
$("#tiles").on("click", ".topics_autocomplete,[id^=eac-container-topics_autocomplete_] li", function (e) {
    e.stopPropagation();
});
$("#tiles").on("click", ".topic_include", function (e) {
    e.stopPropagation();
    var mediatopic = $('#topics_autocomplete_' + $(this).parents('li').index()).val();
    if (mediatopic != null) {
        var mediatopic_id = mediatopic.match(/(?:\()[^\(\)]*?(?:\))/g);
        mediatopic_id = mediatopic_id[mediatopic_id.length - 1];
        if ($(this).parents('li').find('.user_defined_topics').length > 0) {
            $(this).parents('li').find('.user_defined_topics .media_topic').append('<li><a href="http://cv.iptc.org/newscodes/mediatopic/' + mediatopic_id.slice(1, -1) + '?lang=de" target="_blank">' + mediatopic + '</a><img data-parent_id="' + $(this).parents('li').attr('data-id') + '" data-association="why:userdefined" data-topic_id="medtop:' + mediatopic_id + '" class="delete_tag" src="imgs/delete.png"></li>')
        }
        else {
            $(this).parents('li').find('.media_topics').eq(0).after('<div class="media_topics user_defined_topics"><p class="topics_title">User Defined Media Topics</p><ul class="media_topic"><li><a href="http://cv.iptc.org/newscodes/mediatopic/' + mediatopic_id.slice(1, -1) + '?lang=de" target="_blank">' + mediatopic + '</a><img data-parent_id="' + $(this).parents('li').attr('data-id') + '" data-association="why:userdefined" data-topic_id="medtop:' + mediatopic_id + '" class="delete_tag" src="imgs/delete.png"></li></ul></div>');
        }
    }
});
$("#tiles").on("click", ".media_topic a", function (e) {
    e.stopPropagation();
});
