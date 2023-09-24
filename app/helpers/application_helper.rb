module ApplicationHelper
  def turbo_stream_flash
    turbo_stream.update "flash", partial: "flash"
  end

  def map_button(text, id:, img_nm:, data_action:, large: false, hidden: false)
    tag.div(id: id, class: "map-marker align-items-center #{large ? '' : 'map-marker-normal'} #{hidden ? 'hidden' : ''}", data: { action: data_action }, disabled: true) {
      image_tag(img_nm, class: "map-marker-img#{large ? '-large' : ''}") +
      tag.span(text, class: "map-marker-text")
    }
  end
end
