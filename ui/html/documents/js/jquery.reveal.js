(function ($) {


    $.fn.reveal = function () {


        var defaults = {
            animation: 'fadeAndPop',
            animationspeed: 300,
            closeonbackgroundclick: true,
            dismissmodalclass: 'close-reveal-modal'
        };

        var options = $.extend({}, defaults, options);

        return this.each(function () {


            var modal = $(this),
                topMeasure = parseInt(modal.css('top')),
                topOffset = modal.height() + topMeasure,
                locked = false,
                modalBG = $('.reveal-modal-bg');


            if (modalBG.length == 0) {
                modalBG = $('<div class="reveal-modal-bg" />').insertAfter(modal);
            }


            modal.bind('reveal:open', function () {
                modalBG.unbind('click.modalEvent');
                $('.' + options.dismissmodalclass).unbind('click.modalEvent');
                if (!locked) {
                    lockModal();
                    modal.css({
                        'top': 50,//$(document).scrollTop() - topOffset,
                        'opacity': 0,
                        'visibility': 'visible'
                    });
                    modalBG.fadeIn(options.animationspeed / 2);
                    modal.delay(options.animationspeed / 2).animate({
                        "top": '50px',//$(document).scrollTop() + topMeasure + 'px',
                        "opacity": 1
                    }, options.animationspeed, unlockModal());
                }
                modal.unbind('reveal:open');
            });


            modal.bind('reveal:close', function () {

                if (!locked) {
                    lockModal();
                    modalBG.delay(options.animationspeed).fadeOut(options.animationspeed);
                    modal.animate({
                        "top": 50,// $(document).scrollTop() - topOffset + 'px',
                        "opacity": 0
                    }, options.animationspeed / 2, function () {
                        modal.css({
                            'top': 50,//topMeasure,
                            'opacity': 1,
                            'visibility': 'hidden'
                        });
                        unlockModal();
                    });
                }
                modal.unbind('reveal:close');
                if ($(this).attr('id') === "myModal") {
                    var id = $('#myModal').find('.media_topic').find('img').eq(0).attr('data-parent_id');
                    $('li[data-id="' + id + '"]').find('.media_topic').eq(0).html($('#myModal').find('.media_topic').eq(0).html());
                    $('li[data-id="' + id + '"]').find('.media_topic').eq(1).html($('#myModal').find('.media_topic').eq(1).html());
                    $('li[data-id="' + id + '"]').find('.media_topic').eq(2).html($('#myModal').find('.media_topic').eq(2).html());
                }
            });


            modal.trigger('reveal:open')


            var closeButton = $('.' + options.dismissmodalclass).bind('click.modalEvent', function () {
                modal.trigger('reveal:close')
            });

            if (options.closeonbackgroundclick) {
                modalBG.bind('click.modalEvent', function () {
                    modal.trigger('reveal:close')
                });
            }
            $('body').keyup(function (e) {
                if (e.which === 27) {
                    modal.trigger('reveal:close');
                }
            });

            function unlockModal() {
                locked = false;
            }

            function lockModal() {
                locked = true;
            }

        });
    }
})(jQuery);