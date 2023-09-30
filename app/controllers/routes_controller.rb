class RoutesController < ApplicationController
  before_action :set_route, only: %i[ show edit update destroy ]

  # GET /routes
  # Route一覧を表示
  def index
    # クッキーのユーザーIDからユーザーを取得
    @user = User.find_by(id: get_cookies_user_id)

    # ユーザーを取得できなかった場合
    if !@user
      # ユーザーを新規作成
      @user = User.new
      @user.save
      # クッキーにユーザーIDをセット
      set_cookies_user_id(@user)
    end

    # 最終ログイン日時を更新
    @user.update_last_login_at

    # Route情報を取得
    @routes = Route.where(user_id: @user.id).order(:order, created_at: :desc)
    @route = Route.new
    @route.user_id = @user.id
    
    respond_to do |format|
      format.html # HTML形式のビューを表示
      format.json { render json: @routes.to_json() } # JSON形式でデータを返す
    end
  end

  # GET /routes/1
  def show
  end

  # GET /routes/new
  def new
    @route = Route.new
  end

  # GET /routes/1/edit
  def edit
  end

  # POST /routes
  # Route新規登録
  def create
    @route = Route.new(route_params_create)
    @route.user_id = get_cookies_user_id
    @route.order = 0

    if @route.save
      # flash[:info] = "登録しました"
      # redirect_to routes_url
      flash.now.notice = "登録しました"
    else
      render :new, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /routes/1
  # Route情報更新
  def update
    if @route.update(route_params_update)
      # flash[:success] = "更新しました"
      # redirect_to routes_url
      # redirect_to @route, notice: "更新しました"
      flash.now.notice = "更新しました"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  # DELETE /routes/1
  # Route情報削除
  def destroy
    @route.destroy
    # flash[:success] = "削除しました"
    # redirect_to routes_url, status: :see_other
    flash.now.notice = "削除しました"
  end

  # Route情報コピー新規登録
  def copy
    # コピー元のRouteを取得
    @org_route = Route.find(params[:route][:id])

    # Routeを複製
    new_route = @org_route.dup
    new_route.name += "_コピー"
    new_route.order = 0

    # コピー元のRouteに紐づくLocationモデルを複製して、新しいRouteに紐づける
    new_route.locations = @org_route.locations.map { |location| location.dup }

    # 新しいRouteを新規登録
    if new_route.save
      # flash[:success] = "コピーしました"
      # redirect_to routes_url
      @route = new_route
      flash.now.notice = "コピーしました"
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
    # Use callbacks to share common setup or constraints between actions.
    def set_route
      @route = Route.find(params[:id])
    end

    # ルート登録時のストロングパラメータ
    def route_params_create
      params.require(:route).permit(:name, :user_id, :order)
    end

    # ルート登録時のストロングパラメータ
    def route_params_update
      params.require(:route).permit(:name)
    end
end
