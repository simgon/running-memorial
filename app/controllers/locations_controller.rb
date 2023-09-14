class LocationsController < ApplicationController
  # Routeに紐づくLocation情報を取得
  def show
    @route = Route.find(params[:id])
    locations = @route.locations.order(:loc_order)

    respond_to do |format|
      format.html
      format.json { render json: locations.to_json() }
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
