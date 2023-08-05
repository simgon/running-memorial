class LocationsController < ApplicationController
  # Routeに紐づくLocation情報を取得
  def show
    @route = Route.find(params[:id])

    respond_to do |format|
      format.html # HTML形式のビューを表示
      format.json { render json: @route.locations.to_json() } # JSON形式でデータを返す
    end
  end

  # Location登録
  def create
    route_param = params[:route_param]
    @route = Route.find(route_param[:routeId])

    # トランザクションを開始
    ActiveRecord::Base.transaction do
      begin
        # ロケーション情報を削除
        @route.locations.destroy_all

        # ロケーション情報を登録
        route_param["locations"].each_with_index do |loc, index|
          location = @route.locations.build(lat_loc: loc["lat_loc"], lon_loc: loc["lon_loc"], loc_order: index)
          unless location.save
            raise "保存に失敗しました。"
          end
        end
      rescue => e
        puts "エラーが発生しました: #{e.message}"
        render json: { message: 'Failure' }
      end
    end

    render json: { message: 'Success' }
  end
end
