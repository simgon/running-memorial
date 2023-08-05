class RoutesController < ApplicationController
  # Route一覧を表示
  def index
    @routes = Route.order(:order)
    @route = Route.new

    respond_to do |format|
      format.html # HTML形式のビューを表示
      format.json { render json: @routes.to_json() } # JSON形式でデータを返す
    end
  end

  def show
    @route = Route.find(params[:id])
  end

  def new
  end

  # Route新規登録
  def create
    @route = Route.new(route_params)

    if @route.save
      flash[:info] = "登録しました"
      redirect_to routes_url
    else
      render 'index'
    end
  end

  # Route情報更新
  def update
    @route = Route.find(params[:id])
    if @route.update(route_params)
      flash[:success] = "更新しました"
      redirect_to routes_url
    else
      render 'index', status: :unprocessable_entity
    end
  end

  # Route情報削除
  def destroy
    @route = Route.find(params[:id])
    if @route.destroy
      flash[:success] = "削除しました"
      redirect_to routes_url, status: :see_other
    else
      render 'index', status: :see_other
    end
  end

  # Route情報コピー新規登録
  def copy
    # コピー元のRouteを取得
    original_route = Route.find(params[:route][:id])

    # Routeを複製
    new_route = original_route.dup
    new_route.name += "_コピー"

    # コピー元のRouteに紐づくLocationモデルを複製して、新しいRouteに紐づける
    new_route.locations = original_route.locations.map { |location| location.dup }

    # 新しいRouteを新規登録
    if new_route.save
      flash[:success] = "コピーしました"
      redirect_to routes_url
    else
      render 'index'
    end
  end

  # Routeのルート表示区分を更新
  def visible
    route_param = params[:route_param]

    @route = Route.find(route_param[:routeId])
    @route.visible = route_param[:visible]
    unless @route.save
      render json: { message: 'Failure' }
    end

    render json: { message: 'Success' }
  end

  # Routeの並び順を更新
  def order
    route_param = params[:route_param]

    route_param[:routeIds].each_with_index do |routeId, index|
      @route = Route.find(routeId)
      @route.order = index + 1
      unless @route.save
        render json: { message: 'Failure' }
      end
    end

    render json: { message: 'Success' }
  end

  private

    # ルート登録時のストロングパラメータ
    def route_params
      params.require(:route).permit(:name)
    end
end
