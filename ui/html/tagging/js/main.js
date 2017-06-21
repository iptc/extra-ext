$('#search_but').click(function () {
    try {
        var obj = JSON.parse($('#wmd-input').text());
        var str = JSON.stringify(obj, undefined, 4);
        $('#wmd-input').html(syntaxHighlight(str));
        $('#error_modal').slideUp();
        $('#wmd-input').removeClass('error_open');
        $('#result_rules').empty();
        $.ajax({
            type: 'POST',
            url: 'http://' + window.location.hostname + ':8888/extra/api/classifications?schemaId=' + $('#schema_select').val(),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: '{"document":' + str + '}',
            success: function (json) {
                for (var t = 0; t < json.entries.length; t++) {
                    var d = new Date(json.entries[t].createdAt);
                    d = ISODateString(d);
                    var d2 = new Date(json.entries[t].updatedAt);
                    d2 = ISODateString(d2);
                    $('#result_rules').append('<div class="rule" data-id="' + json.entries[t].id + '"><p class="title_rule">' + json.entries[t].name + '</p><p class="date_rule">Created at: <span style="font-weight: bold">' + d + '</span></p><p class="date_rule">Updated at: <span style="font-weight: bold">' + d2 + '</span></p><ul class="media_topic"><li><a href="javascript:void(0);">' + json.entries[t].topicName + '</a></li></ul></div>');
                }
                if (json.total > 0) {
                    $('#zero_rules').hide();
                    //$('.rule[data-id="' + $('#save_but').attr('data-id') + '"]').addClass('highlight_rule');
                    var $articles_pagination = $('#rules_pagination');
                    $('#well_rules').show();
                    $('#rules_list').addClass('open_well');
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
                            parse_results(page);
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
                    $('#rules_list').removeClass('open_well');
                }
            },
            error: function (e) {
            }
        });
    } catch (ex) {
        $("#error_msg").text(ex);
        $('#error_modal').slideDown();
        $('#wmd-input').addClass('error_open');
        $('#well_rules').hide();
        $('#rules_list').removeClass('open_well');
        $('#result_rules').empty();
    }
});
function parse_results(page) {
    try {
        var obj = JSON.parse($('#wmd-input').text());
        var str = JSON.stringify(obj, undefined, 4);
        $('#wmd-input').html(syntaxHighlight(str));
        $('#error_modal').slideUp();
        $('#wmd-input').removeClass('error_open');
        $.ajax({
            type: 'POST',
            url: 'http://' + window.location.hostname + ':8888/extra/api/classifications?page=' + page + 'schemaId=' + $('#schema_select').val(),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: str,
            success: function (json) {
                for (var t = 0; t < json.entries.length; t++) {
                    var d = new Date(json.entries[t].createdAt);
                    d = ISODateString(d);
                    var d2 = new Date(json.entries[t].updatedAt);
                    d2 = ISODateString(d2);
                    $('#result_rules').append('<div class="rule" data-id="' + json.entries[t].id + '"><p class="title_rule">' + json.entries[t].name + '</p><p class="date_rule">Created at: <span style="font-weight: bold">' + d + '</span></p><p class="date_rule">Updated at: <span style="font-weight: bold">' + d2 + '</span></p><ul class="media_topic"><li><a href="javascript:void(0);">' + json.entries[t].topicName + '</a></li></ul></div>');
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
            },
            error: function (e) {
            }
        });
    } catch (ex) {
        $("#error_msg").text(ex);
        $('#error_modal').slideDown();
        $('#wmd-input').addClass('error_open');
        $('#well_rules').hide();
        $('#rules_list').removeClass('open_well');
        $('#result_rules').empty();
    }
}
$('[contenteditable]').on('focus', function () {
    var $this = $(this);
    $this.data('before', $this.html());
    return $this;
}).on('blur keyup paste', function () {
    var $this = $(this);
    if ($this.data('before') !== $this.html()) {
        $this.data('before', $this.html());
        $this.trigger('change');
    }
    return $this;
});
$('#wmd-input').bind('change', function () {
    if ($('#schema_select').val()) {
        if ($(this).html() != "") {
            $('#search_but').attr('disabled', false);
        }
        else {
            $('#search_but').attr('disabled', true);
        }
    }
});
$('#schema_select').on('change', function () {
    if ($("#wmd-input").html() !== "") {
        $('#search_but').attr('disabled', false);
    }
});
$(function () {
    $.ajax({
        type: "GET",
        url: "http://" + window.location.hostname + ":8888/extra/api/schemas",
        dataType: "json",
        success: function (json) {
            for (var i = 0; i < json.entries.length; i++) {
                $('#schema_select').append('<option value="' + json.entries[i].id + '">' + json.entries[i].name + '</option>');
            }
            $('#schema_select').removeAttr('disabled');
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
});
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
$('#error_close').click(function () {
    $('#error_modal').slideUp();
    $('#wmd-input').removeClass('error_open');
});
function ISODateString(d) {
    return pad(d.getUTCMonth() + 1) + '/' + pad(d.getUTCDate()) + '/' + d.getUTCFullYear();
}
function pad(n) {
    return n < 10 ? '0' + n : n
}