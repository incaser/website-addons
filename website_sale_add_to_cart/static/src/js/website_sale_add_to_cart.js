$(document).ready(function () {
    var page_product_id = $('input.product_id').val();//for page of a product
    if (!page_product_id && !$('#products_grid_before'))
        return;
    if (page_product_id && ! $('#add_to_cart').attr('quick-add-to-cart') || $('#cart_products').length )
        return;
    var update_json = $.Deferred();
    update_json.resolve();
    $(".oe_website_sale input.js_quantity").change(function () {
        var $input = $(this);
        if ($input.data('update_change')) {
            return;
        }
        var value = parseInt($input.val(), 10);
        var $dom = $(this).closest('.oe_product_cart');
        var default_price = parseFloat($dom.find('.text-danger > span.oe_currency_value').text().replace(',', '.'));
        var line_id = parseInt($input.data('line-id'),10);
        var product_id = parseInt($input.data('product-id'),10);
        var product_ids = [product_id];
        if (isNaN(value)) value = 0;
        $input.data('update_change', true);
        openerp.jsonRpc("/shop/get_unit_price", 'call', {
            'product_ids': product_ids,
            'add_qty': value,
            'use_order_pricelist': true})
        .then(function (res) {
            //basic case
            $dom.find('span.oe_currency_value').last().text(res[product_id].toFixed(2));
            $dom.find('.text-danger').toggle(res[product_id]<default_price && (default_price-res[product_id] > default_price/100));
            openerp.jsonRpc("/shop/cart/update_json", 'call', {
            'line_id': line_id,
            'product_id': parseInt($input.data('product-id'),10),
            'set_qty': value})
            .then(function (data) {
                $input.data('update_change', false);
                if (value !== parseInt($input.val(), 10)) {
                    $input.trigger('change');
                    return;
                }
                if (!data.quantity) {
                    location.reload(true);
                    return;
                }
                var $q = $(".my_cart_quantity");
                $q.parent().parent().removeClass("hidden", !data.quantity);
                $q.html(data.cart_quantity).hide().fadeIn(600);

                $input.val(data.quantity);
                $('.js_quantity[data-line-id='+line_id+']').val(data.quantity).html(data.quantity);
                $("#cart_total").replaceWith(data['website_sale.total']);
                var self = this;
                var product;
                var price;
                _.each(data['order_lines'], function(line){
                    product = $("span[data-oe-expression='product.price'][data-oe-id='" + line.product_id + "']");
                    price = line.price_unit.toFixed(2).replace('.', ',');
                    var $price_span = product.find('.oe_currency_value');
                    $price_span.text(price);
                    var $price_danger = product.parent().find('del>.oe_currency_value');
                    if (price != $price_danger.text()){
                        $price_danger.parent().show();
                    }else{
                        $price_danger.parent().hide();
                    };
                });
            })
        })
    });
    if (page_product_id)
        $('input.js_quantity').val(0);
    openerp.jsonRpc("/shop/get_order_numbers", 'call').then(function(data){
        if (!data)
            return;
        $.each(data, function(product_id, num){
            if (page_product_id){
                if (page_product_id == product_id){
                    $('input.js_quantity').val(num);
                }
            } else
                $('input[data-product-id="'+product_id+'"]').val(num)
        })
    })

})