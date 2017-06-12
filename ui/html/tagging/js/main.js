$('#search_but').click(function () {
    $('#well_rules').show();
    /*var obj = JSON.parse($('#wmd-input').text());
    var str = JSON.stringify(obj, undefined, 4);
    $('#wmd-input').html(syntaxHighlight(str));*/
    $('#result_rules').empty();
    for (var i = 0; i < 10; i++) {
        $('#result_rules').append('<div class="article"><p class="title_article"> <span>Result:</span>'+i+' </p></div>');
    }
    $('#rules_list').addClass('open_well');
    var $articles_pagination = $('#rules_pagination');
    $('#result_articles,#well_articles').show();
    if ($articles_pagination.data("twbs-pagination")) {
        $articles_pagination.twbsPagination('destroy');
    }
    $articles_pagination.twbsPagination({
        totalPages: 12,
        initiateStartPageClick: false,
        startPage: 1,
        onPageClick: function (event, page) {
        }
    });
});
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
    if ($(this).html() != "") {
        $('#search_but').attr('disabled',false);
    }
    else {
        $('#search_but').attr('disabled', true);
    }
});
$(function () {
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