class LocationsController < ApplicationController
  MAX_ROUTE_MARKER = 100;  # 登録ルートマーカー上限数

  # Routeに紐づくLocation情報を取得
  def show
    @route = Route.find(params[:id])
    locations = @route.locations.order(:loc_order)

    respond_to do |format|
      format.html
      format.json { render json: locations.to_json }
    end
  end

  # Location登録
  def create
    route_param = params[:route_param]
    @route = Route.find(route_param[:routeId])
    user = User.find(@route.user_id)

    # ルート地点上限数チェック
    if route_param['locations'].count > MAX_ROUTE_MARKER && !user.admin
      render json: { result: 'Failure', message: "ルート地点数が上限(#{MAX_ROUTE_MARKER}地点)に達しました。" }
      return
    end

    # トランザクションを開始
    ActiveRecord::Base.transaction do
      # ロケーション情報を削除
      @route.locations.destroy_all

      # ロケーション情報を登録
      route_param['locations'].each_with_index do |loc, index|
        location = @route.locations.build(lat_loc: loc['lat_loc'], lon_loc: loc['lon_loc'], loc_order: index)
        raise '保存に失敗しました。' unless location.save
      end
    rescue StandardError => e
      Rails.logger.debug { "エラーが発生しました: #{e.message}" }
      render json: { result: 'Failure' }
    end

    render json: { result: 'Success' }
  end
end
