var unsaved_rule = false;
var modal_action = 0;
var modal_action_1;
$('#search_but').click(function () {
    $('#success_modal,#zero_articles,#error_modal').hide();
    var viewData = {
        "query": $('#wmd-input').html(),
        "id": $('#save_but').attr('data-id')
    };
    var data = JSON.stringify(viewData);
    $.ajax({
        type: 'POST',
        url: 'http://' + window.location.hostname + ':8888/extra/api/validations?corpus=' + $('#corpus_select').val(),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        data: data,
        success: function (json) {
            if (json.valid === "true") {
                $('#articles_results').css('display', 'inline-block');
                $('#back_articles,#article_big,#rules,#es_dsl').hide();
                $('#result_articles').empty();
                $('#wmd-input').html(json.query);
                $('#success_modal').slideDown();
                $.ajax({
                    type: 'POST',
                    url: 'http://' + window.location.hostname + ':8888/extra/api/documents?page=1&corpus=' + $('#corpus_select').val() + "&match=" + $('.active_match').attr('id'),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    data: data,
                    success: function (json) {
                        var subtitle = "", img_icon = "";
                        $('#ruleMatches').text(json.annotations.ruleMatches);
                        $('#topicOnlyMatches').text(json.annotations.topicOnlyMatches);
                        $('#topicMatches').text(json.annotations.topicMatches);
                        $('#bothMatches').text(json.annotations.bothMatches);
                        $('#ruleOnlyMatches').text(json.annotations.ruleOnlyMatches);
                        $('#recall').text(json.annotations.recall);
                        $('#precision').text(json.annotations.precision);
                        $('#accuracy').text(json.annotations.accuracy);
                        $('#stats_articles,#back_rules').show();
                        if (json.entries.length > 0) {
                            $('#wmd-input').attr('contenteditable', 'false');
                            $('#syntax_but,#search_but,#save_but,#delete_but,#corpus_select').attr('disabled', 'disabled');
                            switch ($('.active_match').attr('id')) {
                                case "topicMatches":
                                case "topicOnlyMatches":
                                    img_icon = '<img class="exclude_topic" src="imgs/delete.png">';
                                    break;
                                case "ruleMatches":
                                case "ruleOnlyMatches":
                                    img_icon = '<img class="include_topic" src="imgs/add-icon.png">';
                                    break;
                                case "bothMatches":
                                    img_icon = '';
                                    break;
                            }
                            for (var i = 0; i < json.entries.length; i++) {
                                subtitle = "";
                                if (json.entries[i].hasOwnProperty('subtitle')) {
                                    subtitle = '<h3 class="title_article subtitle"> <span>Subtitle:</span> ' + json.entries[i].subtitle + '</h3>';
                                }
                                $('#result_articles').append('<div class="article" data-id="' + json.entries[i].id + '"><div style="display: none" class="hidden_article"><p class="title_article"> <span>Title:</span> ' + json.entries[i].title + '</p>' + subtitle + '<h3 class="title_body">Body:</h3>' + json.entries[i].body + '</div><p class="title_article"> <span>Title:</span> ' + json.entries[i].title + img_icon + '</p>' + subtitle + '<h3 class="title_body">Body:</h3><p class="desc_article">' + json.entries[i].body_paragraphs[0].paragraph + '</p></div>');
                            }
                            var $articles_pagination = $('#articles_pagination');
                            $('#result_articles,#well_articles').show();
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
                                    parse_articles(page);
                                }
                            });
                        }
                        else {
                            $('#zero_articles').show();
                            $('#well_articles').hide();
                        }
                    },
                    error: function () {
                    }
                });
            }
            else {
                $('#syntax_but').click();
            }
        },
        error: function (e) {
        }
    });

});
$("#result_articles").on("click", ".article", function () {
    $('#stats_articles,#result_articles,#well_articles,#back_rules,#zero_articles').hide();
    $('#article_big').html($(this).find('.hidden_article').html());
    $('#back_articles,#article_big').show();
});
$("#result_rules").on("click", ".rule:not(.highlight_rule)", function () {
    if (unsaved_rule) {
        $('#modal_rule').text($('#rule_name').text());
        $('#myModal').reveal();
        modal_action = 1;
        modal_action_1 = $(this);
    }
    else {
        $.ajax({
            type: "GET",
            url: "http://" + window.location.hostname + ":8888/extra/api/rules/" + $(this).attr('data-id'),
            dataType: "json",
            success: function (json) {
                unsaved_rule = false;
                $('#wmd-input').html(json.query);
                $('#annotations').hide();
                $('#rule_buttons').show();
                $('#annotations_input').val("");
                $('#rule_name').html(json.name);
                $('#rule_topic').html(json.topicName);
                $('#rule_topic').attr('data-id', json.topicId);
            },
            async: true
        });
        $('#save_but').attr('data-id', $(this).attr('data-id'));
        $('#wmd-input').attr('contenteditable', 'true');
        if ($('#corpus_select').val()) {
            $('#search_but,#syntax_but').removeAttr('disabled');
        }
        $('#save_but,#delete_but').removeAttr('disabled');
        $('#editor,#rule_close').show();
        $('#success_modal,#error_modal').slideUp();
        $('.rule').removeClass('highlight_rule');
        $(this).addClass('highlight_rule');
    }
});
$('#back_articles').click(function () {
    $('#back_articles,#article_big').hide();
    $('#stats_articles,#result_articles,#well_articles,#back_rules').show();
});
$('#back_rules').click(function () {
    $('#wmd-input').attr('contenteditable', 'true');
    if ($('#corpus_select').val()) {
        $('#search_but,#syntax_but').removeAttr('disabled');
    }
    $('#save_but,#delete_but,#corpus_select').removeAttr('disabled');
    $('#articles_results').hide();
    $('#rules').show();
});
$('#syntax_but').click(function () {
    $('#error_modal,#success_modal').hide();
    var viewData = {
        "query": $('#wmd-input').html(),
        "id": $('#save_but').attr('data-id')
    };
    var data = JSON.stringify(viewData);
    $.ajax({
        type: 'POST',
        url: 'http://' + window.location.hostname + ':8888/extra/api/validations?corpus=' + $('#corpus_select').val(),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        data: data,
        success: function (json) {
            $('#wmd-input').html(json.query);
            $('#rules,#articles_results,#no_output_esdsl,#no_output_html,#no_output_tree').hide();
            $('#es_dsl').show();
            if (json.es_dsl != "") {
                var obj = JSON.parse(json.es_dsl);
                var str = JSON.stringify(obj, undefined, 4);
                $('#esdsl_content').html(syntaxHighlight(str));
            }
            else {
                $('#esdsl_content').html("");
                $('#no_output_esdsl').show();
            }

            if (json.html != "") {
                $('#html_content').html(json.html);
            }
            else {
                $('#html_content').html("");
                $('#no_output_html').show();
            }

            if (json.tree != "") {
                $('#tree_content').jstree("destroy");
                $('#tree_content').html(json.tree);
                $('#tree_content').jstree();
            }
            else {
                $('#tree_content').html("");
                $('#no_output_tree').show();
            }

            var active = $('.btn-primary').attr('id');
            $('#esdsl,#tree,#html').hide();

            switch (active) {
                case "esdsl_but":
                    $('#esdsl').show();
                    break;
                case "tree_but":
                    $('#tree').show();
                    break;
                case "html_but":
                    $('#html').show();
                    break
            }
            if (json.valid === "true") {
                $('#success_modal').slideDown();
            }
            else {
                $('#error_modal').slideDown();
                $('#error_msg').html(json.message);
            }
        },
        error: function (e) {
        }
    });

});
$('#save_but').click(function () {

    $('#annotations').show();
    $('#rule_buttons').hide();
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd
    }
    if (mm < 10) {
        mm = '0' + mm
    }
    today = mm + '/' + dd + '/' + yyyy;
    $('#annotations_date').text(today);

});
$('#delete_but').click(function () {
    $("#delete_edit").attr('data-ref', 'rule_but');
    $("#delete_message").slideDown();
});
$('#save_but_annotation').click(function () {
    var viewData = {
        "query": $('#wmd-input').html()
    };
    var data = JSON.stringify(viewData);
    $.ajax({
        type: 'PUT',
        url: 'http://' + window.location.hostname + ':8888/extra/api/rules/' + $('#save_but').attr('data-id'),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        data: data,
        success: function () {
            unsaved_rule = false;
            $('#annotations').hide();
            $('#rule_buttons').show();
            $('#annotations_input').val("");
            $('#success_modal,#error_modal').slideUp();
            if (modal_action === 4) {
                window.location.href = modal_action_1;
            }
        },
        error: function (e) {
        }
    });
});
$('#new_rule_but').click(function () {
    $('#new_rule').slideDown(300, function () {
        $('#rules_list').addClass('new_rule_open');
    });
});
$('#cancel_rule_but').click(function () {
    $('#new_rule').slideUp(300, function () {
        $('#rules_list').removeClass('new_rule_open');
    });

});
$('#search_rule_but').click(function () {
    if ($('#lang_select').val()) {
        $('#zero_rules').hide();
        $('#result_rules').empty();
        var mediatopic = $('#topics_autocomplete').val().match(/(?:\()[^\(\)]*?(?:\))/g);
        if (mediatopic != null) {
            mediatopic = mediatopic[0].slice(1, -1);
        }
        else {
            mediatopic = "";
        }
        $.ajax({
            type: "GET",
            url: "http://" + window.location.hostname + ":8888/extra/api/rules?taxonomy=" + $('#lang_select').val() + "&topicId=" + mediatopic,
            dataType: "json",
            success: function (json) {
                var status;
                for (var t = 0; t < json.entries.length; t++) {
                    var d = new Date(json.entries[t].createdAt);
                    d = ISODateString(d);
                    var d2 = new Date(json.entries[t].updatedAt);
                    d2 = ISODateString(d2);
                    switch (json.entries[t].status) {
                        case "new":
                            status = '<div class="legendcolor" style="background-color:#EE6C4D;"></div><div class="legendtext">New</div>';
                            break;
                        case "draft":
                            status = '<div class="legendcolor" style="background-color:#6A8D73;"></div><div class="legendtext">Draft</div>';
                            break;
                        case "submitted":
                            status = '<div class="legendcolor" style="background-color:#C7A27C;"></div><div class="legendtext">Submitted</div>';
                            break;
                    }
                    $('#result_rules').append('<div class="rule" data-id="' + json.entries[t].id + '"><p class="submit_rule">Submit</p><img class="delete_icon" src=imgs/delete.png><p class="title_rule">' + json.entries[t].name + '</p><p class="date_rule">Created at: <span style="font-weight: bold">' + d + '</span></p><p class="date_rule">Updated at: <span style="font-weight: bold">' + d2 + '</span></p><ul class="media_topic"><li><a href="javascript:void(0);">' + json.entries[t].topicName + '</a></li></ul><div class="status">' + status + '</div><p class="copy_rule">Copy ID</p></div>');
                }
                if (json.total > 0) {
                    $('.rule[data-id="' + $('#save_but').attr('data-id') + '"]').addClass('highlight_rule');
                    var $articles_pagination = $('#rules_pagination');
                    $('#well_rules').show();
                    $('#rules_list').addClass('rules_result');
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
                            $('#result_rules').empty();
                            parse_rules(page);
                        }
                    });
                    var options = {
                        autoResize: true,
                        container: $('#result_rules'),
                        offset: 10,
                        itemWidth: 322,
                        outerOffset: 0
                    };

                    var handler = $('#result_rules > .rule');
                    handler.wookmark(options);
                }
                else {
                    $('#zero_rules').show();
                    $('#well_rules').hide();
                    $('#rules_list').removeClass('rules_result');
                }
            },
            async: true
        });
    }
});
$('#create_rule_but').click(function () {
    if ($('#create_rule').val() !== "") {
        if (unsaved_rule) {
            $('#modal_rule').text($('#rule_name').text());
            $('#myModal').reveal();
            modal_action = 2;
        }
        else {
            $('#wmd-input').attr('contenteditable', 'true');
            if ($('#corpus_select').val()) {
                $('#search_but,#syntax_but').removeAttr('disabled');
            }
            $('#save_but,#delete_but').removeAttr('disabled');
            $('#editor,#rule_close').show();
            $('#rule_name').html($('#create_rule').val());
            $('#wmd-input').html('');
            $('#success_modal,#error_modal').slideUp();
            var mediatopic = $('#topics_autocomplete').val().match(/(?:\()[^\(\)]*?(?:\))/g);
            var mediatopicname = $('#topics_autocomplete').val().replace(mediatopic, '').slice(0, -1);
            mediatopic = mediatopic[0].slice(1, -1);
            $('#rule_topic').html(mediatopicname);
            $('#rule_topic').attr('data-id', mediatopic);
            var viewData = {
                "name": $('#create_rule').val(),
                "query": "",
                "uid": "",
                "taxonomy": $('#lang_select').val(),
                "topicId": mediatopic,
                "topicName": mediatopicname
            };
            var data = JSON.stringify(viewData);
            $.ajax({
                type: 'POST',
                url: 'http://' + window.location.hostname + ':8888/extra/api/rules',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                data: data,
                success: function (json) {
                    unsaved_rule = false;
                    $('#save_but').attr('data-id', json.id);
                    $('#search_rule_but').click();
                    $('#annotations').hide();
                    $('#rule_buttons').show();
                    $('#annotations_input').val("");
                },
                error: function (e) {
                }
            });
        }
    }
});
$("#create_rule").keyup(function (e) {
    if (e.keyCode === 13) {
        $('#create_rule_but').click();
    }
});
var options;
$(function () {
    var taxonomy_id = gup('taxonomy_id');
    var topic_id = gup('topic_id');
    if ((taxonomy_id === "") || (topic_id === "")) {
        $.ajax({
            type: "GET",
            url: "http://" + window.location.hostname + ":8888/extra/api/taxonomies",
            dataType: "json",
            success: function (json) {
                for (var i = 0; i < json.entries.length; i++) {
                    $('#lang_select').append('<option data-num="' + json.entries[i].topics + '" value="' + json.entries[i].id + '">' + json.entries[i].name + ' - ' + json.entries[i].language + '</option>')
                }
            },
            async: true
        });
        options = {
            url: ""
        };
        $("#topics_autocomplete").easyAutocomplete(options);
    }
    else {
        $.ajax({
            type: "GET",
            url: "http://" + window.location.hostname + ":8888/extra/api/corpora?taxonomy=" + taxonomy_id,
            dataType: "json",
            success: function (json) {
                for (var i = 0; i < json.entries.length; i++) {
                    $('#corpus_select').append('<option value="' + json.entries[i].id + '">' + json.entries[i].name + '</option>');
                }
                $('#corpus_select').removeAttr('disabled');
            },
            async: true
        });
        $.ajax({
            type: "GET",
            url: "http://" + window.location.hostname + ":8888/extra/api/taxonomies",
            dataType: "json",
            success: function (json) {
                for (var i = 0; i < json.entries.length; i++) {
                    $('#lang_select').append('<option data-num="' + json.entries[i].topics + '" value="' + json.entries[i].id + '">' + json.entries[i].name + ' - ' + json.entries[i].language + '</option>')
                }
                $('#lang_select').val(taxonomy_id);
            },
            async: false
        });
        $('#topics_autocomplete,#search_rule_but,#new_rule_but').removeAttr('disabled');
        options = {
            url: "http://" + window.location.hostname + ":8888/extra/api/taxonomies/" + taxonomy_id + "/topics?nPerPage=" + $('#lang_select').find(':selected').attr('data-num'),
            getValue: "label",
            listLocation: "entries",
            minCharNumber: 2,
            list: {
                match: {
                    enabled: true
                },
                onChooseEvent: function (e) {
                },
                onHideListEvent: function () {
                    $('#zero_rules').hide();
                    $('#result_rules').empty();
                    var mediatopic = $('#topics_autocomplete').val().match(/(?:\()[^\(\)]*?(?:\))/g);
                    if (mediatopic != null) {
                        $('#new_rule_but').removeAttr('disabled');
                        mediatopic = mediatopic[0].slice(1, -1);
                        $.ajax({
                            type: "GET",
                            url: "http://" + window.location.hostname + ":8888/extra/api/rules?taxonomy=" + $('#lang_select').val() + "&topicId=" + mediatopic,
                            dataType: "json",
                            success: function (json) {
                                var status;
                                for (var t = 0; t < json.entries.length; t++) {
                                    var d = new Date(json.entries[t].createdAt);
                                    d = ISODateString(d);
                                    var d2 = new Date(json.entries[t].updatedAt);
                                    d2 = ISODateString(d2);
                                    switch (json.entries[t].status) {
                                        case "new":
                                            status = '<div class="legendcolor" style="background-color:#EE6C4D;"></div><div class="legendtext">New</div>';
                                            break;
                                        case "draft":
                                            status = '<div class="legendcolor" style="background-color:#6A8D73;"></div><div class="legendtext">Draft</div>';
                                            break;
                                        case "submitted":
                                            status = '<div class="legendcolor" style="background-color:#C7A27C;"></div><div class="legendtext">Submitted</div>';
                                            break;
                                    }
                                    $('#result_rules').append('<div class="rule" data-id="' + json.entries[t].id + '"><p class="submit_rule">Submit</p><img class="delete_icon" src=imgs/delete.png><p class="title_rule">' + json.entries[t].name + '</p><p class="date_rule">Created at: <span style="font-weight: bold">' + d + '</span></p><p class="date_rule">Updated at: <span style="font-weight: bold">' + d2 + '</span></p><ul class="media_topic"><li><a href="javascript:void(0);">' + json.entries[t].topicName + '</a></li></ul><div class="status">' + status + '</div><p class="copy_rule">Copy ID</p></div>');
                                }
                                if (json.total > 0) {
                                    $('.rule[data-id="' + $('#save_but').attr('data-id') + '"]').addClass('highlight_rule');
                                    var $articles_pagination = $('#rules_pagination');
                                    $('#well_rules').show();
                                    $('#rules_list').addClass('rules_result');
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
                                            $('#result_rules').empty();
                                            parse_rules(page);
                                        }
                                    });
                                    var options = {
                                        autoResize: true,
                                        container: $('#result_rules'),
                                        offset: 10,
                                        itemWidth: 322,
                                        outerOffset: 0
                                    };

                                    var handler = $('#result_rules > .rule');
                                    handler.wookmark(options);
                                }
                                else {
                                    $('#zero_rules').show();
                                    $('#well_rules').hide();
                                    $('#rules_list').removeClass('rules_result');
                                }
                            },
                            async: true
                        });
                    }
                    else {
                        $('#new_rule_but').attr('disabled', 'disabled');
                        $('#new_rule').slideUp(300, function () {
                            $('#rules_list').removeClass('new_rule_open');
                        });
                    }
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
        $("#topics_autocomplete").val(topic_id.replace(/%20/g, ' ')).easyAutocomplete(options);
        $('#search_rule_but').click();
    }


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
$('#corpus_select').on('change', function () {
    if ($("#wmd-input").attr("contentEditable") === "true") {
        $('#search_but,#syntax_but').removeAttr('disabled');
    }
});
$('#lang_select').on('change', function () {
    $.ajax({
        type: "GET",
        url: "http://" + window.location.hostname + ":8888/extra/api/corpora?taxonomy=" + this.value,
        dataType: "json",
        success: function (json) {
            $('#corpus_select').find('option').not(':first').remove();
            for (var i = 0; i < json.entries.length; i++) {
                $('#corpus_select').append('<option value="' + json.entries[i].id + '">' + json.entries[i].name + '</option>');
            }
            $('#corpus_select').removeAttr('disabled');
        },
        async: true
    });
    $('#topics_autocomplete,#search_rule_but').removeAttr('disabled');
    $('#result_rules').empty();
    $('#well_rules,#zero_rules').hide();
    $('#rules_list').removeClass('rules_result');
    $('#new_rule').slideUp(300, function () {
        $('#rules_list').removeClass('new_rule_open');
    });
    options = {
        url: "http://" + window.location.hostname + ":8888/extra/api/taxonomies/" + this.value + "/topics?nPerPage=" + $(this).find(':selected').attr('data-num'),
        getValue: "label",
        listLocation: "entries",
        minCharNumber: 2,
        list: {
            match: {
                enabled: true
            },
            onChooseEvent: function (e) {
            },
            onHideListEvent: function () {
                $('#zero_rules').hide();
                $('#result_rules').empty();
                var mediatopic = $('#topics_autocomplete').val().match(/(?:\()[^\(\)]*?(?:\))/g);
                if (mediatopic != null) {
                    $('#new_rule_but').removeAttr('disabled');
                    mediatopic = mediatopic[0].slice(1, -1);
                    $.ajax({
                        type: "GET",
                        url: "http://" + window.location.hostname + ":8888/extra/api/rules?taxonomy=" + $('#lang_select').val() + "&topicId=" + mediatopic,
                        dataType: "json",
                        success: function (json) {
                            var status;
                            for (var t = 0; t < json.entries.length; t++) {
                                var d = new Date(json.entries[t].createdAt);
                                d = ISODateString(d);
                                var d2 = new Date(json.entries[t].updatedAt);
                                d2 = ISODateString(d2);
                                switch (json.entries[t].status) {
                                    case "new":
                                        status = '<div class="legendcolor" style="background-color:#EE6C4D;"></div><div class="legendtext">New</div>';
                                        break;
                                    case "draft":
                                        status = '<div class="legendcolor" style="background-color:#6A8D73;"></div><div class="legendtext">Draft</div>';
                                        break;
                                    case "submitted":
                                        status = '<div class="legendcolor" style="background-color:#C7A27C;"></div><div class="legendtext">Submitted</div>';
                                        break;
                                }
                                $('#result_rules').append('<div class="rule" data-id="' + json.entries[t].id + '"><p class="submit_rule">Submit</p><img class="delete_icon" src=imgs/delete.png><p class="title_rule">' + json.entries[t].name + '</p><p class="date_rule">Created at: <span style="font-weight: bold">' + d + '</span></p><p class="date_rule">Updated at: <span style="font-weight: bold">' + d2 + '</span></p><ul class="media_topic"><li><a href="javascript:void(0);">' + json.entries[t].topicName + '</a></li></ul><div class="status">' + status + '</div><p class="copy_rule">Copy ID</p></div>');
                            }
                            if (json.total > 0) {
                                $('.rule[data-id="' + $('#save_but').attr('data-id') + '"]').addClass('highlight_rule');
                                var $articles_pagination = $('#rules_pagination');
                                $('#well_rules').show();
                                $('#rules_list').addClass('rules_result');
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
                                        $('#result_rules').empty();
                                        parse_rules(page);
                                    }
                                });
                                var options = {
                                    autoResize: true,
                                    container: $('#result_rules'),
                                    offset: 10,
                                    itemWidth: 322,
                                    outerOffset: 0
                                };

                                var handler = $('#result_rules > .rule');
                                handler.wookmark(options);
                            }
                            else {
                                $('#zero_rules').show();
                                $('#well_rules').hide();
                                $('#rules_list').removeClass('rules_result');
                            }
                        },
                        async: true
                    });
                }
                else {
                    $('#new_rule_but').attr('disabled', 'disabled');
                    $('#new_rule').slideUp(300, function () {
                        $('#rules_list').removeClass('new_rule_open');
                    });
                }
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
    $("#topics_autocomplete").val("").easyAutocomplete(options);
    $('#new_rule_but').attr('disabled', 'disabled');
});
$('#success_close').click(function () {
    $('#success_modal').slideUp();
});
$('#error_close').click(function () {
    $('#error_modal').slideUp();
});
$('#rule_close').click(function () {
    if (unsaved_rule) {
        $('#modal_rule').text($('#rule_name').text());
        $('#myModal').reveal();
        modal_action = 3;
    }
    else {
        $('#rule_name').text('-');
        $('#rule_topic').html('-');
        $('#rule_topic').attr('data-id', '-');
        $('#rule_close,#es_dsl').hide();
        $('#back_rules,#back_articles').click();
        $('.highlight_rule').removeClass('highlight_rule');
        $('#success_modal,#error_modal').slideUp();
        $('#wmd-input').attr('contenteditable', 'false').html('');
        $('#syntax_but,#search_but,#save_but,#delete_but').attr('disabled', 'disabled');
        unsaved_rule = false;
    }
});
$('#json_close').click(function () {
    $('#es_dsl').hide();
    $('#rules').show();
});
function parse_articles(page) {
    var viewData = {
        "query": $('#wmd-input').html(),
        "id": $('#save_but').attr('data-id')
    };
    var data = JSON.stringify(viewData);
    $('#result_articles').empty();
    $.ajax({
        type: 'POST',
        url: 'http://' + window.location.hostname + ':8888/extra/api/documents?page=' + page + '&corpus=' + $('#corpus_select').val() + "&match=" + $('.active_match').attr('id'),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        data: data,
        success: function (json) {
            var subtitle = "", img_icon = "";
            $('#ruleMatches').text(json.annotations.ruleMatches);
            $('#topicOnlyMatches').text(json.annotations.topicOnlyMatches);
            $('#topicMatches').text(json.annotations.topicMatches);
            $('#bothMatches').text(json.annotations.bothMatches);
            $('#ruleOnlyMatches').text(json.annotations.ruleOnlyMatches);
            $('#recall').text(json.annotations.recall);
            $('#precision').text(json.annotations.precision);
            $('#accuracy').text(json.annotations.accuracy);
            switch ($('.active_match').attr('id')) {
                case "topicMatches":
                case "topicOnlyMatches":
                    img_icon = '<img class="exclude_topic" src="imgs/delete.png">';
                    break;
                case "ruleMatches":
                case "ruleOnlyMatches":
                    img_icon = '<img class="include_topic" src="imgs/add-icon.png">';
                    break;
                case "bothMatches":
                    img_icon = '';
                    break;
            }
            for (var i = 0; i < json.entries.length; i++) {
                subtitle = "";
                if (json.entries[i].hasOwnProperty('subtitle')) {
                    subtitle = '<h3 class="title_article subtitle"> <span>Subtitle:</span> ' + json.entries[i].subtitle + '</h3>';
                }
                $('#result_articles').append('<div class="article" data-id="' + json.entries[i].id + '"><div style="display: none" class="hidden_article"><p class="title_article"> <span>Title:</span> ' + json.entries[i].title + '</p>' + subtitle + '<h3 class="title_body">Body:</h3>' + json.entries[i].body + '</div><p class="title_article"> <span>Title:</span> ' + json.entries[i].title + img_icon + '</p>' + subtitle + '<h3 class="title_body">Body:</h3><p class="desc_article">' + json.entries[i].body_paragraphs[0].paragraph + '</p></div>');
            }
        },
        error: function () {
        }
    });
}
function parse_rules(page) {
    var mediatopic = $('#topics_autocomplete').val().match(/(?:\()[^\(\)]*?(?:\))/g);
    if (mediatopic != null) {
        mediatopic = mediatopic[0].slice(1, -1);
    }
    else {
        mediatopic = "";
    }
    $.ajax({
        type: "GET",
        url: "http://" + window.location.hostname + ":8888/extra/api/rules?page=" + page + "&taxonomy=" + $('#lang_select').val() + "&topicId=" + mediatopic,
        dataType: "json",
        success: function (json) {
            var status;
            for (var t = 0; t < json.entries.length; t++) {
                var d = new Date(json.entries[t].createdAt);
                d = ISODateString(d);
                var d2 = new Date(json.entries[t].updatedAt);
                d2 = ISODateString(d2);
                switch (json.entries[t].status) {
                    case "new":
                        status = '<div class="legendcolor" style="background-color:#EE6C4D;"></div><div class="legendtext">New</div>';
                        break;
                    case "draft":
                        status = '<div class="legendcolor" style="background-color:#6A8D73;"></div><div class="legendtext">Draft</div>';
                        break;
                    case "submitted":
                        status = '<div class="legendcolor" style="background-color:#C7A27C;"></div><div class="legendtext">Submitted</div>';
                        break;
                }
                $('#result_rules').append('<div class="rule" data-id="' + json.entries[t].id + '"><p class="submit_rule">Submit</p><img class="delete_icon" src=imgs/delete.png><p class="title_rule">' + json.entries[t].name + '</p><p class="date_rule">Created at: <span style="font-weight: bold">' + d + '</span></p><p class="date_rule">Updated at: <span style="font-weight: bold">' + d2 + '</span></p><ul class="media_topic"><li><a href="javascript:void(0);">' + json.entries[t].topicName + '</a></li></ul><div class="status">' + status + '</div><p class="copy_rule">Copy ID</p></div>');
            }
            var options = {
                autoResize: true,
                container: $('#result_rules'),
                offset: 10,
                itemWidth: 322,
                outerOffset: 0
            };

            var handler = $('#result_rules > .rule');
            handler.wookmark(options);
            $('.rule[data-id="' + $('#save_but').attr('data-id') + '"]').addClass('highlight_rule');
        },
        async: true
    });
}
$("#result_rules").on("click", ".delete_icon", function (e) {
    e.stopPropagation();
    $(this).parent('div').addClass('deleted_selection_rule');
    $("#delete_edit").attr('data-ref', 'rule');
    $("#delete_message").slideDown();
});
$("#result_rules").on("click", ".submit_rule", function (e) {
    e.stopPropagation();
    $(this).siblings('.status').html('<div class="legendcolor" style="background-color:#C7A27C;"></div><div class="legendtext">Submitted</div>')
});
$("#result_rules").on("click", ".copy_rule", function (e) {
    e.stopPropagation();
    copyToClipboard($(this).parent('div').attr('data-id'));
});
function copyToClipboard(text) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(text).select();
    document.execCommand("copy");
    $temp.remove();
}
$("#result_articles").on("click", ".exclude_topic", function (e) {
    e.stopPropagation();
    var $this = $(this);
    $.ajax({
        type: "PUT",
        url: "http://" + window.location.hostname + ":5000/api/documents/" + $(this).parents('.article').attr('data-id') + "?corpus=" + $('#corpus_select').val() + "&exclude=true&association=why:direct&topic=" + $('#rule_topic').attr('data-id'),
        dataType: "json",
        success: function () {
            $this.parents('.article').remove();
        },
        async: true
    });
});
$("#result_articles").on("click", ".include_topic", function (e) {
    e.stopPropagation();
    var $this = $(this);
    $.ajax({
        type: "PUT",
        dataType: "json",
        url: "http://" + window.location.hostname + ":5000/api/topics/" + $('#rule_topic').attr('data-id') + "?corpus=" + $('#corpus_select').val() + "&document_id=" + $this.parents('.article').attr('data-id'),
        success: function () {
            $this.parents('.article').remove();
        },
        async: true
    });
});
function ISODateString(d) {
    return pad(d.getUTCMonth() + 1) + '/' + pad(d.getUTCDate()) + '/' + d.getUTCFullYear();
}
function pad(n) {
    return n < 10 ? '0' + n : n
}
function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}
$('#wmd-input').bind('change', function () {
    unsaved_rule = true;
});
$('body').on('focus', '[contenteditable]', function () {
    var $this = $(this);
    $this.data('before', $this.html());
    return $this;
}).on('blur keyup paste input', '[contenteditable]', function () {
    var $this = $(this);
    if ($this.data('before') !== $this.html()) {
        $this.data('before', $this.html());
        $this.trigger('change');
    }
    return $this;
});
$('#save_changes').click(function () {
    $('#save_but_annotation').click();
    switch (modal_action) {
        case 1:
            $.ajax({
                type: "GET",
                url: "http://" + window.location.hostname + ":8888/extra/api/rules/" + modal_action_1.attr('data-id'),
                dataType: "json",
                success: function (json) {
                    unsaved_rule = false;
                    $('#wmd-input').html(json.query);
                    $('#annotations').hide();
                    $('#rule_buttons').show();
                    $('#annotations_input').val("");
                    $('#rule_name').html(json.name);
                    $('#rule_topic').html(json.topicName);
                    $('#rule_topic').attr('data-id', json.topicId);
                },
                async: true
            });
            $('#save_but').attr('data-id', modal_action_1.attr('data-id'));
            $('#wmd-input').attr('contenteditable', 'true');
            if ($('#corpus_select').val()) {
                $('#search_but,#syntax_but').removeAttr('disabled');
            }
            $('#save_but,#delete_but').removeAttr('disabled');
            $('#editor,#rule_close').show();
            $('#success_modal,#error_modal').slideUp();
            $('.rule').removeClass('highlight_rule');
            modal_action_1.addClass('highlight_rule');
            break;
        case 2:
            $('#wmd-input').attr('contenteditable', 'true');
            if ($('#corpus_select').val()) {
                $('#search_but,#syntax_but').removeAttr('disabled');
            }
            $('#save_but,#delete_but').removeAttr('disabled');
            $('#editor,#rule_close').show();
            $('#rule_name').html($('#create_rule').val());
            $('#wmd-input').html('');
            $('#success_modal,#error_modal').slideUp();
            var mediatopic = $('#topics_autocomplete').val().match(/(?:\()[^\(\)]*?(?:\))/g);
            var mediatopicname = $('#topics_autocomplete').val().replace(mediatopic, '').slice(0, -1);
            mediatopic = mediatopic[0].slice(1, -1);
            $('#rule_topic').html(mediatopicname);
            $('#rule_topic').attr('data-id', mediatopic);
            var viewData = {
                "name": $('#create_rule').val(),
                "query": "",
                "uid": "",
                "taxonomy": $('#lang_select').val(),
                "topicId": mediatopic,
                "topicName": mediatopicname
            };
            var data = JSON.stringify(viewData);
            $.ajax({
                type: 'POST',
                url: 'http://' + window.location.hostname + ':8888/extra/api/rules',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                data: data,
                success: function (json) {
                    unsaved_rule = false;
                    $('#save_but').attr('data-id', json.id);
                    $('#search_rule_but').click();
                    $('#annotations').hide();
                    $('#rule_buttons').show();
                    $('#annotations_input').val("");
                },
                error: function (e) {
                }
            });
            break;
        case 3:
            $('#rule_name').text('-');
            $('#rule_topic').html('-');
            $('#rule_topic').attr('data-id', '-');
            $('#rule_close,#es_dsl').hide();
            $('#back_rules,#back_articles').click();
            $('.highlight_rule').removeClass('highlight_rule');
            $('#success_modal,#error_modal').slideUp();
            $('#wmd-input').attr('contenteditable', 'false').html('');
            $('#syntax_but,#search_but,#save_but,#delete_but').attr('disabled', 'disabled');
            unsaved_rule = false;
            break;
        case 4:
            //redirect and save
            break;
    }
    $('.close-reveal-modal').click();
});
$('#dismiss_changes').click(function () {
    switch (modal_action) {
        case 1:
            $.ajax({
                type: "GET",
                url: "http://" + window.location.hostname + ":8888/extra/api/rules/" + modal_action_1.attr('data-id'),
                dataType: "json",
                success: function (json) {
                    unsaved_rule = false;
                    $('#wmd-input').html(json.query);
                    $('#annotations').hide();
                    $('#rule_buttons').show();
                    $('#annotations_input').val("");
                    $('#rule_name').html(json.name);
                    $('#rule_topic').html(json.topicName);
                    $('#rule_topic').attr('data-id', json.topicId);
                },
                async: true
            });
            $('#save_but').attr('data-id', modal_action_1.attr('data-id'));
            $('#wmd-input').attr('contenteditable', 'true');
            if ($('#corpus_select').val()) {
                $('#search_but,#syntax_but').removeAttr('disabled');
            }
            $('#save_but,#delete_but').removeAttr('disabled');
            $('#editor,#rule_close').show();
            $('#success_modal,#error_modal').slideUp();
            $('.rule').removeClass('highlight_rule');
            modal_action_1.addClass('highlight_rule');
            break;
        case 2:

            $('#wmd-input').attr('contenteditable', 'true');
            if ($('#corpus_select').val()) {
                $('#search_but,#syntax_but').removeAttr('disabled');
            }
            $('#save_but,#delete_but').removeAttr('disabled');
            $('#editor,#rule_close').show();
            $('#rule_name').html($('#create_rule').val());
            $('#wmd-input').html('');
            $('#success_modal,#error_modal').slideUp();
            var mediatopic = $('#topics_autocomplete').val().match(/(?:\()[^\(\)]*?(?:\))/g);
            var mediatopicname = $('#topics_autocomplete').val().replace(mediatopic, '').slice(0, -1);
            mediatopic = mediatopic[0].slice(1, -1);
            $('#rule_topic').html(mediatopicname);
            $('#rule_topic').attr('data-id', mediatopic);
            var viewData = {
                "name": $('#create_rule').val(),
                "query": "",
                "uid": "",
                "taxonomy": $('#lang_select').val(),
                "topicId": mediatopic,
                "topicName": mediatopicname
            };
            var data = JSON.stringify(viewData);
            $.ajax({
                type: 'POST',
                url: 'http://' + window.location.hostname + ':8888/extra/api/rules',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                data: data,
                success: function (json) {
                    unsaved_rule = false;
                    $('#save_but').attr('data-id', json.id);
                    $('#search_rule_but').click();
                    $('#annotations').hide();
                    $('#rule_buttons').show();
                    $('#annotations_input').val("");
                },
                error: function (e) {
                }
            });
            break;
        case 3:
            $('#rule_name').text('-');
            $('#rule_topic').html('-');
            $('#rule_topic').attr('data-id', '-');
            $('#rule_close,#es_dsl').hide();
            $('#back_rules,#back_articles').click();
            $('.highlight_rule').removeClass('highlight_rule');
            $('#success_modal,#error_modal').slideUp();
            $('#wmd-input').attr('contenteditable', 'false').html('');
            $('#syntax_but,#search_but,#save_but,#delete_but').attr('disabled', 'disabled');
            unsaved_rule = false;
            break;
        case 4:
            window.location.href = modal_action_1;
            break;
    }
    $('.close-reveal-modal').click();
});
$(".btn-group").on("click", ".btn-default", function (e) {
    $('.btn-group').find('button').removeClass('btn-primary').addClass('btn-default');
    $(this).addClass('btn-primary').removeClass('btn-default');
    var active = $(this).attr('id');
    $('#esdsl,#tree,#html').hide();
    switch (active) {
        case "esdsl_but":
            $('#esdsl').show();
            break;
        case "tree_but":
            $('#tree').show();
            break;
        case "html_but":
            $('#html').show();
            break
    }
});
$("#cancel_delete").click(function () {
    $("#delete_message").slideUp();
    $('.deleted_selection_rule').removeClass('deleted_selection_rule');
});
$("#delete_edit").click(function () {
    if ($(this).attr('data-ref') === "rule") {
        $.ajax({
            type: 'DELETE',
            url: 'http://' + window.location.hostname + ':8888/extra/api/rules/' + $('.deleted_selection_rule').attr('data-id'),
            success: function () {
                $("#delete_message").slideUp();
                if ($('.deleted_selection_rule').hasClass('highlight_rule')) {
                    $('#rule_name').text('-');
                    $('#rule_topic').html('-');
                    $('#rule_topic').attr('data-id', '-');
                    $('#wmd-input').attr('contenteditable', 'false').html('');
                    $('#syntax_but,#search_but,#save_but,#delete_but').attr('disabled', 'disabled');
                    $('#rule_close').hide();
                }
                $('.deleted_selection_rule').remove();
                $('#search_rule_but').click();
            },
            error: function (e) {
            }
        });
    }
    else {
        $.ajax({
            type: 'DELETE',
            url: 'http://' + window.location.hostname + ':8888/extra/api/rules/' + $('#save_but').attr('data-id'),
            success: function () {
                unsaved_rule = false;
                $("#delete_message").slideUp();
                $('#json_close').click();
                $('#rule_name').text('-');
                $('#rule_topic').html('-');
                $('#rule_topic').attr('data-id', '-');
                $('#wmd-input').attr('contenteditable', 'false').html('');
                $('#syntax_but,#search_but,#save_but,#delete_but').attr('disabled', 'disabled');
                $('#rule_close').hide();
                $('#success_modal,#error_modal').slideUp();
                $('.rule[data-id="' + $('#save_but').attr('data-id') + '"]').remove();
                $('#search_rule_but').click();
            },
            error: function (e) {
            }
        });
    }
});
function gup(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null) return "";
    else return results[1];
}
$('#stats_articles td').click(function () {
    if (!$(this).hasClass('active_match')) {
        $('#stats_articles td').removeClass('active_match');
        $(this).addClass('active_match');

        var viewData = {
            "query": $('#wmd-input').html(),
            "id": $('#save_but').attr('data-id')
        };
        var data = JSON.stringify(viewData);
        $.ajax({
            type: 'POST',
            url: 'http://' + window.location.hostname + ':8888/extra/api/documents?page=1&corpus=' + $('#corpus_select').val() + "&match=" + $('.active_match').attr('id'),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: data,
            success: function (json) {
                var subtitle = "", img_icon = "";
                $('#result_articles').empty();
                $('#ruleMatches').text(json.annotations.ruleMatches);
                $('#topicOnlyMatches').text(json.annotations.topicOnlyMatches);
                $('#topicMatches').text(json.annotations.topicMatches);
                $('#bothMatches').text(json.annotations.bothMatches);
                $('#ruleOnlyMatches').text(json.annotations.ruleOnlyMatches);
                $('#recall').text(json.annotations.recall);
                $('#precision').text(json.annotations.precision);
                $('#accuracy').text(json.annotations.accuracy);
                switch ($('.active_match').attr('id')) {
                    case "topicMatches":
                    case "topicOnlyMatches":
                        img_icon = '<img class="exclude_topic" src="imgs/delete.png">';
                        break;
                    case "ruleMatches":
                    case "ruleOnlyMatches":
                        img_icon = '<img class="include_topic" src="imgs/add-icon.png">';
                        break;
                    case "bothMatches":
                        img_icon = '';
                        break;
                }
                if (json.entries.length > 0) {
                    for (var i = 0; i < json.entries.length; i++) {
                        subtitle = "";
                        if (json.entries[i].hasOwnProperty('subtitle')) {
                            subtitle = '<h3 class="title_article subtitle"> <span>Subtitle:</span> ' + json.entries[i].subtitle + '</h3>';
                        }
                        $('#result_articles').append('<div class="article" data-id="' + json.entries[i].id + '"><div style="display: none" class="hidden_article"><p class="title_article"> <span>Title:</span> ' + json.entries[i].title + '</p>' + subtitle + '<h3 class="title_body">Body:</h3>' + json.entries[i].body + '</div><p class="title_article"> <span>Title:</span> ' + json.entries[i].title + img_icon + '</p>' + subtitle + '<h3 class="title_body">Body:</h3><p class="desc_article">' + json.entries[i].body_paragraphs[0].paragraph + '</p></div>');
                    }
                    var $articles_pagination = $('#articles_pagination');
                    $('#stats_articles,#result_articles,#well_articles,#back_rules').show();
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
                            parse_articles(page);
                        }
                    });
                }
                else {
                    $('#zero_articles').show();
                    $('#well_articles').hide();
                }
            },
            error: function () {
            }
        });
    }
});
$('#hamburger-menu a').click(function (e) {
    if ($(this).attr('href') !== "#") {
        if (unsaved_rule) {
            $('#hamburger-icon').click();
            e.preventDefault();
            $('#modal_rule').text($('#rule_name').text());
            $('#myModal').reveal();
            modal_action = 4;
            modal_action_1 = $(this).attr('href');
        }
    }
});
